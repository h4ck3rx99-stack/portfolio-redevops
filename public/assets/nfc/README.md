# NFC product photos (pending from the owner)

The NFC band on the homepage and `/nfc.html` currently show line-drawn illustrations.
To replace one with a real photo of a delivered product:

1. Add the photo here with exactly this name (JPG, 1200×900, 4:3, under 300 KB):
   - `smart-business-card.jpg`
   - `google-review-stand.jpg`
   - `menu-table-tag.jpg`
   - `custom-nfc-tag.jpg`
2. In `index.html` and `nfc.html`, find the product's `<svg …>` inside `<li class="nfc-product">`
   and replace it with:
   `<img class="nfc-product__photo" src="assets/nfc/<file>.jpg" width="1200" height="900" alt="<describe the photo>" loading="lazy">`

The `.nfc-product__photo` style already exists in `css/components.css`. Use real photos only.
