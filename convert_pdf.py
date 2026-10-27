import fitz
import os

pdf_path = r"e:\GE\SUSTAINABILITY INTERACTIVE BOARD\download_2026-03-02_10-26-37\APP SUSTAIN 0902_Folder\APP SUSTAIN 1002_VIEW.pdf"
output_dir = r"e:\GE\SUSTAINABILITY INTERACTIVE BOARD\pdf_slides"

os.makedirs(output_dir, exist_ok=True)

doc = fitz.open(pdf_path)
print(f"Total pages: {doc.page_count}")

# Only first 4 pages
for i in range(min(4, doc.page_count)):
    page = doc[i]
    mat = fitz.Matrix(2.0, 2.0)
    pix = page.get_pixmap(matrix=mat)
    output_path = os.path.join(output_dir, f"slide_{i+1}.png")
    pix.save(output_path)
    print(f"Saved slide {i+1} to {output_path}")

doc.close()
print("Done!")
