import sys
try:
    import pypdf
    reader = pypdf.PdfReader(sys.argv[1])
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    print(text)
    sys.exit(0)
except ImportError:
    pass

try:
    import PyPDF2
    reader = PyPDF2.PdfReader(sys.argv[1])
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    print(text)
    sys.exit(0)
except ImportError:
    pass

try:
    import fitz # PyMuPDF
    doc = fitz.open(sys.argv[1])
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    print(text)
    sys.exit(0)
except ImportError:
    print("No PDF library found. Please install pypdf, PyPDF2, or PyMuPDF.")
    sys.exit(1)
