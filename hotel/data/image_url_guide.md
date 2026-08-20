# How to Replace Placeholder Image URLs

Once you have generated your Midjourney images, follow these steps to
get them into the database.

---

## Step 1 — Generate images on Midjourney

1. Go to [midjourney.com](https://midjourney.com) or the Discord bot
2. Open `hotel/data/midjourney_prompts.txt`
3. Copy each `/imagine prompt: ...` line and run it
4. When the 4-image grid appears, click **U1 / U2 / U3 / U4** to upscale the best one
5. Right-click the upscaled image → **Save image**
6. Name the file exactly as the placeholder ID — e.g. `m01_sirloin_steak.jpg`

You need **56 images** total (50 items + 6 category headers).

---

## Step 2 — Upload images to a host

**Option A — GitHub (free, simple)**

```bash
# In this repo, create the folder
mkdir -p hotel/images/menu

# Copy your downloaded images there
cp ~/Downloads/m01_sirloin_steak.jpg hotel/images/menu/

# Commit and push
git add hotel/images/menu/
git commit -m "add: menu food photography"
git push
```

Your image URL will be:
```
https://raw.githubusercontent.com/YOUR_USERNAME/FlavorFind/main/hotel/images/menu/m01_sirloin_steak.jpg
```

**Option B — Cloudflare R2 (recommended for production)**

1. Create a free Cloudflare account
2. Go to R2 → Create bucket → name it `mamba-menu`
3. Upload all images
4. Enable public access on the bucket
5. Your URL will be: `https://pub-XXXX.r2.dev/m01_sirloin_steak.jpg`

---

## Step 3 — Edit the seed script

Open `hotel/data/seed_menu.sql` and replace each `PLACEHOLDER_xxx` with
the real URL.

**Find & replace in your editor:**

| Find                                    | Replace with (your real URL)                         |
|-----------------------------------------|------------------------------------------------------|
| `PLACEHOLDER_m01_sirloin_steak`         | `https://your-host.com/m01_sirloin_steak.jpg`        |
| `PLACEHOLDER_m02_herb_roasted_chicken`  | `https://your-host.com/m02_herb_roasted_chicken.jpg` |
| ... (repeat for all 56 items)           |                                                      |

**Or use sed on the command line:**

```bash
sed -i "s|PLACEHOLDER_m01_sirloin_steak|https://your-host.com/m01.jpg|g" hotel/data/seed_menu.sql
```

---

## Step 4 — Run the seed script on the server

```bash
# Copy the updated script to the server
scp hotel/data/seed_menu.sql root@134.209.20.131:/tmp/seed_menu.sql

# SSH in and run it
ssh root@134.209.20.131
sudo -u postgres psql -d hotel -f /tmp/seed_menu.sql
```

You will see a verification table at the end:

```
     category      | items
-------------------+-------
 Starters & Soups  |     8
 Mains             |    12
 Pasta & Rice      |     6
 Sides             |     6
 Desserts          |     8
 Drinks            |    10
(6 rows)

 total_upsell_rules
--------------------
                 48
```

---

## Step 5 — Clear the API cache

```bash
ssh root@134.209.20.131 "cd /var/www/hotel/backend && php8.4 artisan cache:clear"
```

Then open the guest app — all images will appear immediately:
`https://mamba.flavorfind.co.ke/table/mamba-table-1-token-0000000000001`

---

## Placeholder reference

| Placeholder ID                          | Item                        |
|-----------------------------------------|-----------------------------|
| PLACEHOLDER_starters_category           | Starters & Soups (category) |
| PLACEHOLDER_mains_category              | Mains (category)            |
| PLACEHOLDER_pasta_category              | Pasta & Rice (category)     |
| PLACEHOLDER_sides_category              | Sides (category)            |
| PLACEHOLDER_desserts_category           | Desserts (category)         |
| PLACEHOLDER_drinks_category             | Drinks (category)           |
| PLACEHOLDER_s01_crispy_calamari         | Crispy Calamari             |
| PLACEHOLDER_s02_beef_broth_soup         | Beef Broth Soup             |
| PLACEHOLDER_s03_bruschetta              | Bruschetta al Pomodoro      |
| PLACEHOLDER_s04_pumpkin_soup            | Pumpkin Cream Soup          |
| PLACEHOLDER_s05_garlic_prawn_skewers    | Garlic Prawn Skewers        |
| PLACEHOLDER_s06_chicken_liver_pate      | Chicken Liver Pâté          |
| PLACEHOLDER_s07_tomato_basil_soup       | Tomato Basil Soup           |
| PLACEHOLDER_s08_potato_skins            | Loaded Potato Skins         |
| PLACEHOLDER_m01_sirloin_steak           | Grilled Sirloin Steak       |
| PLACEHOLDER_m02_herb_roasted_chicken    | Herb Roasted Chicken        |
| PLACEHOLDER_m03_pan_seared_tilapia      | Pan-Seared Tilapia          |
| PLACEHOLDER_m04_beef_short_ribs         | Slow-Braised Beef Short Ribs|
| PLACEHOLDER_m05_chicken_tikka_masala    | Chicken Tikka Masala        |
| PLACEHOLDER_m06_grilled_salmon          | Grilled Salmon Fillet       |
| PLACEHOLDER_m07_lamb_chops              | Lamb Chops with Mint Jus    |
| PLACEHOLDER_m08_beef_burger             | Beef Burger Classic         |
| PLACEHOLDER_m09_butter_chicken          | Butter Chicken              |
| PLACEHOLDER_m10_grilled_snapper         | Whole Grilled Snapper       |
| PLACEHOLDER_m11_vegetable_curry         | Vegetable Coconut Curry     |
| PLACEHOLDER_m12_chicken_schnitzel       | Chicken Schnitzel           |
| PLACEHOLDER_p01_spaghetti_carbonara     | Spaghetti Carbonara         |
| PLACEHOLDER_p02_penne_arrabbiata        | Penne Arrabbiata            |
| PLACEHOLDER_p03_fettuccine_alfredo      | Fettuccine Alfredo          |
| PLACEHOLDER_p04_basmati_rice            | Steamed Basmati Rice        |
| PLACEHOLDER_p05_chicken_fried_rice      | Chicken Fried Rice          |
| PLACEHOLDER_p06_mushroom_risotto        | Mushroom Risotto            |
| PLACEHOLDER_si01_hand_cut_chips         | Hand-Cut Chips              |
| PLACEHOLDER_si02_mashed_potato          | Creamy Mashed Potato        |
| PLACEHOLDER_si03_garlic_spinach         | Sautéed Garlic Spinach      |
| PLACEHOLDER_si04_roasted_vegetables     | Roasted Root Vegetables     |
| PLACEHOLDER_si05_broccoli               | Steamed Broccoli            |
| PLACEHOLDER_si06_grilled_corn           | Grilled Corn on the Cob     |
| PLACEHOLDER_de01_chocolate_fondant      | Chocolate Fondant           |
| PLACEHOLDER_de02_creme_brulee           | Classic Crème Brûlée        |
| PLACEHOLDER_de03_cheesecake             | New York Cheesecake         |
| PLACEHOLDER_de04_mango_panna_cotta      | Mango Panna Cotta           |
| PLACEHOLDER_de05_banana_foster_pancakes | Banana Foster Pancakes      |
| PLACEHOLDER_de06_tiramisu               | Tiramisu                    |
| PLACEHOLDER_de07_fruit_salad            | Fruit Salad with Cream      |
| PLACEHOLDER_de08_malva_pudding          | Warm Malva Pudding          |
| PLACEHOLDER_d01_still_water             | Still Water                 |
| PLACEHOLDER_d02_coca_cola               | Coca-Cola                   |
| PLACEHOLDER_d03_orange_juice            | Fresh Orange Juice          |
| PLACEHOLDER_d04_mango_smoothie          | Mango Passion Smoothie      |
| PLACEHOLDER_d05_sparkling_water         | Sparkling Water             |
| PLACEHOLDER_d06_ginger_lemonade         | Ginger Lemonade             |
| PLACEHOLDER_d07_hot_coffee              | Hot Coffee                  |
| PLACEHOLDER_d08_dessert_wine            | Dessert Wine                |
| PLACEHOLDER_d09_masala_chai             | Masala Chai                 |
| PLACEHOLDER_d10_virgin_mojito           | Virgin Mojito               |
