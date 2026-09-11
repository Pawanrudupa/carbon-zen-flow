"""
CarbonLedger ML Emission Estimation Model
==========================================
Algorithm:  GradientBoostingRegressor (scikit-learn)
R² Score:   0.9950 (test set)  |  CV R²: 0.9965 (5-fold)
MAE:        4.134 kg CO₂
Samples:    5,000 (4,000 train / 1,000 test)
Dataset:    Synthetic — derived from IPCC AR6, EPA, IEA emission factors
Features:   13 (category, food type, portion, organic, local, transport mode,
               distance, passengers, energy type, units, green tariff,
               shop category, secondhand flag)

Run:  python train_model.py
Output: ml_coefficients.json  (loaded by src/utils/mlModel.ts)
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score
import json
import warnings
warnings.filterwarnings('ignore')

# ─────────────────────────────────────────────────────────────────────────────
# 1. GENERATE SYNTHETIC DATASET
#    Based on real emission factors from:
#    - IPCC AR6 (2022) lifecycle GHG data
#    - EPA GHG equivalencies calculator
#    - IEA electricity carbon intensity by fuel
#    - WRAP UK clothing carbon footprint report
# ─────────────────────────────────────────────────────────────────────────────

np.random.seed(42)
N = 5000

# ── Food ─────────────────────────────────────────────────────────────────────
food_types = ['beef','chicken','pork','fish','dairy','eggs',
              'vegetables','grains','processed','fastfood']
food_factors = {
    'beef': 27, 'chicken': 6.9, 'pork': 12.1, 'fish': 6.1,
    'dairy': 3.2, 'eggs': 4.5, 'vegetables': 2.0, 'grains': 1.4,
    'processed': 8.2, 'fastfood': 5.5
}
food_n = N // 4
food_types_arr = np.random.choice(food_types, food_n)
portions = np.random.choice(
    [0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0], food_n,
    p=[0.05, 0.20, 0.30, 0.25, 0.10, 0.07, 0.03]
)
is_organic = np.random.choice([0, 1], food_n, p=[0.7, 0.3])
is_local   = np.random.choice([0, 1], food_n, p=[0.6, 0.4])
food_co2 = (
    np.array([food_factors[t] for t in food_types_arr])
    * portions
    * (1 - 0.07 * is_organic)
    * (1 - 0.05 * is_local)
    + np.random.normal(0, 0.3, food_n)
)
food_co2 = np.clip(food_co2, 0.1, 40)

food_df = pd.DataFrame({
    'category': 'food', 'food_type': food_types_arr,
    'portion': portions, 'is_organic': is_organic, 'is_local': is_local,
    'transport_mode': 'none', 'distance_km': 0, 'passengers': 1,
    'energy_type': 'none', 'energy_units': 0, 'is_green_energy': 0,
    'shop_category': 'none', 'is_secondhand': 0, 'co2_kg': food_co2
})

# ── Transport ─────────────────────────────────────────────────────────────────
transport_modes = [
    'car_petrol','car_diesel','car_electric','motorcycle',
    'bus','train','metro','cycle','flight_domestic','flight_international'
]
transport_factors = {
    'car_petrol': 0.21, 'car_diesel': 0.17, 'car_electric': 0.07,
    'motorcycle': 0.11, 'bus': 0.089, 'train': 0.041, 'metro': 0.028,
    'cycle': 0.0, 'flight_domestic': 0.255, 'flight_international': 0.195
}
transport_n = N // 4
tmodes    = np.random.choice(transport_modes, transport_n)
distances = np.where(
    np.isin(tmodes, ['flight_domestic', 'flight_international']),
    np.random.randint(500, 8000, transport_n),
    np.random.randint(1, 100, transport_n)
)
passengers = np.random.choice([1,2,3,4,5], transport_n, p=[0.50,0.25,0.12,0.08,0.05])
transport_co2 = (
    np.array([transport_factors[m] for m in tmodes]) * distances / passengers
    + np.random.normal(0, 0.5, transport_n)
)
transport_co2 = np.clip(transport_co2, 0.0, 2000)

transport_df = pd.DataFrame({
    'category': 'transport', 'food_type': 'none',
    'portion': 0, 'is_organic': 0, 'is_local': 0,
    'transport_mode': tmodes, 'distance_km': distances, 'passengers': passengers,
    'energy_type': 'none', 'energy_units': 0, 'is_green_energy': 0,
    'shop_category': 'none', 'is_secondhand': 0, 'co2_kg': transport_co2
})

# ── Energy ────────────────────────────────────────────────────────────────────
energy_types = [
    'electricity_coal','electricity_gas','electricity_renewable',
    'natural_gas','heating_oil','lpg','biomass'
]
energy_factors = {
    'electricity_coal': 0.82, 'electricity_gas': 0.45,
    'electricity_renewable': 0.05, 'natural_gas': 2.04,
    'heating_oil': 2.52, 'lpg': 1.55, 'biomass': 0.39
}
energy_n = N // 4
etypes   = np.random.choice(energy_types, energy_n)
units    = np.random.choice(
    [1, 2, 5, 10, 15, 20, 30, 50, 100], energy_n,
    p=[0.05, 0.10, 0.15, 0.20, 0.20, 0.15, 0.10, 0.04, 0.01]
)
is_green = np.random.choice([0, 1], energy_n, p=[0.75, 0.25])
energy_co2 = (
    np.array([energy_factors[t] for t in etypes])
    * units
    * (1 - 0.70 * is_green)
    + np.random.normal(0, 0.5, energy_n)
)
energy_co2 = np.clip(energy_co2, 0.01, 300)

energy_df = pd.DataFrame({
    'category': 'energy', 'food_type': 'none',
    'portion': 0, 'is_organic': 0, 'is_local': 0,
    'transport_mode': 'none', 'distance_km': 0, 'passengers': 1,
    'energy_type': etypes, 'energy_units': units, 'is_green_energy': is_green,
    'shop_category': 'none', 'is_secondhand': 0, 'co2_kg': energy_co2
})

# ── Shopping ──────────────────────────────────────────────────────────────────
shop_cats = [
    'clothing','electronics','furniture','appliances',
    'books','toys','sports','beauty','food_delivery','jewelry'
]
shop_factors = {
    'clothing': 15, 'electronics': 50, 'furniture': 30, 'appliances': 45,
    'books': 1, 'toys': 5, 'sports': 8, 'beauty': 3,
    'food_delivery': 2.5, 'jewelry': 20
}
shop_n   = N // 4
scats    = np.random.choice(shop_cats, shop_n)
is_used  = np.random.choice([0, 1], shop_n, p=[0.75, 0.25])
quantity = np.random.choice([1, 2, 3], shop_n, p=[0.70, 0.20, 0.10])
shop_co2 = (
    np.array([shop_factors[c] for c in scats])
    * quantity
    * (0.10 + 0.90 * (1 - is_used))
    + np.random.normal(0, 1, shop_n)
)
shop_co2 = np.clip(shop_co2, 0.1, 200)

shop_df = pd.DataFrame({
    'category': 'shopping', 'food_type': 'none',
    'portion': 0, 'is_organic': 0, 'is_local': 0,
    'transport_mode': 'none', 'distance_km': 0, 'passengers': 1,
    'energy_type': 'none', 'energy_units': 0, 'is_green_energy': 0,
    'shop_category': scats, 'is_secondhand': is_used, 'co2_kg': shop_co2
})

# ─────────────────────────────────────────────────────────────────────────────
# 2. MERGE & ENCODE
# ─────────────────────────────────────────────────────────────────────────────

df = pd.concat([food_df, transport_df, energy_df, shop_df], ignore_index=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

encoders = {}
for col, enc_name in [
    ('category','cat'), ('food_type','food'), ('transport_mode','tmode'),
    ('energy_type','etype'), ('shop_category','scat')
]:
    le = LabelEncoder()
    df[f'{enc_name}_enc'] = le.fit_transform(df[col])
    encoders[col] = {str(cls): int(idx) for idx, cls in enumerate(le.classes_)}

FEATURES = [
    'cat_enc','food_enc','portion','is_organic','is_local',
    'tmode_enc','distance_km','passengers',
    'etype_enc','energy_units','is_green_energy',
    'scat_enc','is_secondhand'
]

X = df[FEATURES]
y = df['co2_kg']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ─────────────────────────────────────────────────────────────────────────────
# 3. TRAIN & COMPARE MODELS
# ─────────────────────────────────────────────────────────────────────────────

models = {
    'GradientBoosting': GradientBoostingRegressor(
        n_estimators=200, max_depth=5, learning_rate=0.05, random_state=42
    ),
    'RandomForest': RandomForestRegressor(
        n_estimators=150, max_depth=8, random_state=42, n_jobs=-1
    ),
    'Ridge': Ridge(alpha=10.0),
}

print("\n─── Model Comparison ───────────────────────────────────")
results = {}
for name, model in models.items():
    model.fit(X_train, y_train)
    preds  = model.predict(X_test)
    mae    = mean_absolute_error(y_test, preds)
    r2     = r2_score(y_test, preds)
    cv_r2  = cross_val_score(model, X, y, cv=5, scoring='r2', n_jobs=-1).mean()
    results[name] = {'mae': mae, 'r2': r2, 'cv_r2': cv_r2, 'model': model}
    print(f"{name:22s}  MAE={mae:.3f} kg  R²={r2:.4f}  CV R²={cv_r2:.4f}")

best_name  = max(results, key=lambda k: results[k]['r2'])
best_model = results[best_name]['model']
best_r2    = results[best_name]['r2']
best_mae   = results[best_name]['mae']
print(f"\n✓ Best: {best_name}  R²={best_r2:.4f}  MAE={best_mae:.3f} kg")

# ─────────────────────────────────────────────────────────────────────────────
# 4. EXTRACT COEFFICIENTS FOR JAVASCRIPT
# ─────────────────────────────────────────────────────────────────────────────

def predict_row(cat, food='none', portion=0, org=0, local=0,
                tmode='none', dist=0, pax=1,
                etype='none', eunits=0, green=0,
                scat='none', used=0):
    row = [[
        encoders['category'][cat],
        encoders['food_type'][food],
        portion, org, local,
        encoders['transport_mode'][tmode],
        dist, pax,
        encoders['energy_type'][etype],
        eunits, green,
        encoders['shop_category'][scat],
        used
    ]]
    return float(best_model.predict(row)[0])

# Food coefficients
food_coeff = {}
for ft in food_types:
    base  = predict_row('food', food=ft, portion=1.0)
    org   = predict_row('food', food=ft, portion=1.0, org=1)
    local = predict_row('food', food=ft, portion=1.0, local=1)
    food_coeff[ft] = {
        'base_per_kg':       round(base, 3),
        'organic_modifier':  round(org / base,   3) if base > 0 else 1.0,
        'local_modifier':    round(local / base, 3) if base > 0 else 1.0,
    }

# Transport coefficients
transport_coeff = {}
for tm in transport_modes:
    base4 = predict_row('transport', tmode=tm, dist=100, pax=4)
    base1 = predict_row('transport', tmode=tm, dist=100, pax=1)
    transport_coeff[tm] = {
        'per_km_1pax':                round(base1 / 100, 4),
        'passenger_reduction_factor': round(base4 / base1, 3) if base1 > 0 else 1.0,
    }

# Energy coefficients
energy_coeff = {}
for et in energy_types:
    base  = predict_row('energy', etype=et, eunits=10)
    green = predict_row('energy', etype=et, eunits=10, green=1)
    energy_coeff[et] = {
        'per_unit':      round(base / 10, 4),
        'green_modifier': round(green / base, 3) if base > 0 else 1.0,
    }

# Shopping coefficients
shopping_coeff = {}
for sc in shop_cats:
    new_co2  = predict_row('shopping', scat=sc)
    used_co2 = predict_row('shopping', scat=sc, used=1)
    shopping_coeff[sc] = {
        'new_item_co2':         round(new_co2,  3),
        'secondhand_co2':       round(used_co2, 3),
        'secondhand_saving_pct': round((1 - used_co2 / new_co2) * 100, 1) if new_co2 > 0 else 0.0,
    }

# ─────────────────────────────────────────────────────────────────────────────
# 5. EXPORT JSON
# ─────────────────────────────────────────────────────────────────────────────

output = {
    'meta': {
        'model':            best_name,
        'n_estimators':     200,
        'max_depth':        5,
        'learning_rate':    0.05,
        'r2_score':         round(best_r2,  4),
        'mae_kg':           round(best_mae, 3),
        'cv_r2':            round(results[best_name]['cv_r2'], 4),
        'training_samples': len(X_train),
        'test_samples':     len(X_test),
        'features':         FEATURES,
        'dataset':          'Synthetic dataset based on IPCC AR6 emission factors, EPA guidelines, and IEA energy data',
        'version':          '1.0.0',
    },
    'food':      food_coeff,
    'transport': transport_coeff,
    'energy':    energy_coeff,
    'shopping':  shopping_coeff,
    'encoders':  encoders,
}

with open('ml_coefficients.json', 'w') as f:
    json.dump(output, f, indent=2)

print(f"\n✓ ml_coefficients.json written ({len(json.dumps(output))} chars)")
print(f"  Copy src/utils/mlModel.ts to your project and it will load these values.")
