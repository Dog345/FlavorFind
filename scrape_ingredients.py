import urllib.request, urllib.parse, json

API = "https://flavorfind-22iw.onrender.com/api/v1/ingredients/search"

SEEDS = [
    "chicken","beef","pork","lamb","fish","shrimp","salmon","tuna","egg","milk",
    "butter","cheese","cream","flour","sugar","salt","pepper","oil","garlic","onion",
    "tomato","potato","carrot","spinach","rice","pasta","bread","corn","bean","tofu",
    "apple","lemon","lime","banana","mango","mushroom","broccoli","zucchini","squash",
    "avocado","almond","walnut","peanut","basil","oregano","thyme","cilantio","ginger",
    "cinnamon","vanilla","chocolate","honey","vinegar","mustard","bacon","ham","turkey",
    "duck","anchovy","clam","scallop","cheddar","mozzarella","parmesan","feta","ricotta",
    "tortilla","noodle","spaghetti","penne","quinoa","barley","kale","cabbage","fennel",
    "eggplant","chili","paprika","turmeric","cumin","blueberry","strawberry","raspberry",
    "pineapple","baking","sesame","tahini","pesto","salsa","chorizo","tilapia","cod",
    "dijon","sriracha","chipotle","buttermilk","mascarpone","prosciutto","pancetta",
    "breadcrumb","panko","ground beef","chicken breast","olive oil","coconut milk",
    "sour cream","cream cheese","brown sugar","tomato paste","black bean","chickpea",
    "kidney bean","bell pepper","sweet potato","green onion","white wine","red wine",
    "heavy cream","beef broth","chicken broth","vegetable broth","canned tomato",
    "balsamic","worcestershire","tabasco","lemon juice","orange juice","apple cider",
    "whole wheat","all purpose","skim milk","greek yogurt","cottage cheese","crab",
    "lobster","oyster","mussel","gouda","leek","artichoke","asparagus","cauliflower",
    "rosemary","parsley","mint","nutmeg","cardamom","saffron","clove","bay leaf",
    "watermelon","coconut","pistachio","cashew","flaxseed","chia","sunflower","raisin",
    "apricot","fig","cranberry","pomegranate","kiwi","lentil","edamame","pea",
    "soy sauce","hoisin","teriyaki","fish sauce","rice vinegar","sesame oil",
    "polenta","couscous","bulgur","grits","hot sauce","chive","dill","tarragon",
    "sage","marjoram","coriander","allspice","anise","caraway","fenugreek","sumac",
    "miso","sake","mirin","dashi","togarashi","wasabi","nori","seaweed","tempeh",
    "jackfruit","plantain","cassava","yam","taro","jicama","daikon","bok choy",
    "snap pea","snow pea","okra","radish","turnip","parsnip","rutabaga","beet",
    "watercress","endive","radicchio","escarole","frisee","arugula","chard",
    "pork chop","spare rib","tenderloin","sirloin","ribeye","brisket","chuck",
    "ground turkey","ground pork","ground lamb","Italian sausage","andouille",
    "half and half","whipping cream","evaporated milk","condensed milk",
    "cream of mushroom","cream of chicken","tomato soup","chicken noodle",
    "white rice","brown rice","jasmine rice","basmati rice","arborio","wild rice",
    "linguine","fettuccine","rigatoni","orzo","farfalle","rotini","macaroni",
    "phyllo","puff pastry","pie crust","biscuit","dumpling","wonton","spring roll",
]

all_ids = set()
results = []

print(f"Starting scrape of {len(SEEDS)} seeds...")
for i, seed in enumerate(SEEDS):
    url = f"{API}?q={urllib.parse.quote(seed)}&limit=50"
    try:
        data = json.loads(urllib.request.urlopen(url, timeout=10).read())
        for r in data.get('results', []):
            if r['id'] not in all_ids:
                all_ids.add(r['id'])
                results.append({
                    'id': r['id'],
                    'name': r['name'],
                    'category': r['category'],
                    'recipe_count': r['recipe_count']
                })
    except:
        pass
    if (i + 1) % 50 == 0:
        print(f"  {i+1}/{len(SEEDS)} seeds — {len(results)} unique ingredients")

results.sort(key=lambda x: x['recipe_count'], reverse=True)
out = json.dumps(results, separators=(',', ':'))

with open('/home/m/Documents/GitHub/FlavorFind/frontend/public/ingredients.json', 'w') as f:
    f.write(out)

print(f"\nDone! {len(results)} ingredients saved ({len(out)/1024:.1f} KB)")
print("Top 15:", [r['name'] for r in results[:15]])
