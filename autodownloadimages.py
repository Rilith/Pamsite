import os
import re
import requests
import zipfile
from bs4 import BeautifulSoup
from urllib.parse import urlparse, unquote

# --- Configuration ---
html_filename = "about.html"              # Input HTML file
output_html_filename = "about_local.html" # Output HTML file with updated image references
images_dir = "images"
subfolder = "gifs"                  # New subfolder inside "images"
zip_filename = "site.zip"

# --- Mapping from Content-Type to file extension ---
EXT_MAP = {
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    # add more mappings if needed
}

def get_extension(url, content_type):
    """
    Determine the correct file extension based on the Content-Type header.
    If not available or not mapped, fall back to the URL extension or default to .gif.
    """
    if content_type:
        ext = EXT_MAP.get(content_type.lower())
        if ext:
            return ext
    parsed = urlparse(url)
    base = os.path.basename(parsed.path)
    base = unquote(base)
    _, ext = os.path.splitext(base)
    if ext:
        return ext
    return ".gif"

def get_filename_from_url(url, index, content_type=None):
    """
    Create a safe filename using the URL and the proper extension.
    If the URL's basename is missing or too generic (e.g. "giphy.gif"), 
    it falls back to a default name.
    """
    ext = get_extension(url, content_type)
    parsed = urlparse(url)
    base = os.path.basename(parsed.path)
    base = unquote(base)
    if not base or '.' not in base or base.lower() == "giphy.gif":
        parent = os.path.basename(os.path.dirname(parsed.path))
        if parent:
            base = parent
        else:
            base = f"image_{index}"
    name, _ = os.path.splitext(base)
    name = re.sub(r'[\\/*?:"<>|]', "_", name)
    return name + ext

# --- Create folder for images if it doesn't exist ---
os.makedirs(images_dir, exist_ok=True)
# Create subfolder inside images
target_images_dir = os.path.join(images_dir, subfolder)
os.makedirs(target_images_dir, exist_ok=True)

# --- Load HTML content ---
with open(html_filename, "r", encoding="utf-8") as f:
    html_content = f.read()

soup = BeautifulSoup(html_content, "html.parser")

# --- Dictionary to keep track of category counters ---
category_counters = {}

# --- Process each <img> tag ---
img_tags = soup.find_all("img")
for index, img in enumerate(img_tags, start=1):
    src_url = img.get("src")
    if not src_url:
        continue  # Skip if there's no src

    try:
        print(f"Downloading {src_url} ...")
        response = requests.get(src_url, timeout=10)
        response.raise_for_status()
        content_type = response.headers.get("Content-Type", "")
        
        # Determine the category-based base name using the nearest preceding <h3> tag
        category_tag = img.find_previous("h3")
        if category_tag:
            cat = category_tag.get_text().strip()
            cat_clean = re.sub(r'\W+', '', cat).lower()
            category_counters.setdefault(cat_clean, 0)
            category_counters[cat_clean] += 1
            base_name = f"{cat_clean}{category_counters[cat_clean]}"
        else:
            base_name = f"image_{index}"
        
        ext = get_extension(src_url, content_type)
        local_filename = base_name + ext
        local_filepath = os.path.join(target_images_dir, local_filename)
        
        with open(local_filepath, "wb") as img_file:
            img_file.write(response.content)
        print(f"Saved as {local_filepath}")
    except Exception as e:
        print(f"Error downloading {src_url}: {e}")
        continue

    # Update the src attribute to point to the local file (using relative path)
    img["src"] = os.path.join(images_dir, subfolder, local_filename)

# --- Write the modified HTML to a new file ---
with open(output_html_filename, "w", encoding="utf-8") as f:
    f.write(str(soup))
print(f"Modified HTML saved as {output_html_filename}")

# --- Create a zip file containing the images folder and the modified HTML ---
with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    zipf.write(output_html_filename)
    for root, dirs, files in os.walk(images_dir):
        for file in files:
            file_path = os.path.join(root, file)
            zipf.write(file_path, os.path.relpath(file_path))
print(f"All files zipped into {zip_filename}")
