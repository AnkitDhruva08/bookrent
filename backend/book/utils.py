import requests

def fetch_book_from_openlibrary(title):
    """
    Fetch book details from OpenLibrary by title.
    """
    try:
        url = f"https://openlibrary.org/search.json?title={title}"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        print('OpenLibrary response data:', data)

        if not data["docs"]:
            return None

        book_data = data["docs"][0]
        print('Book data from OpenLibrary:', book_data)

        # Construct cover image URL if available
        cover_id = book_data.get("cover_i")
        print('Cover ID:', cover_id)
        cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else None

        return {
            "title": book_data.get("title", title),
            "author": ", ".join(book_data.get("author_name", [])) if book_data.get("author_name") else "Unknown",
            "pages": book_data.get("number_of_pages_median", 0) or 0,
            "cover_url": cover_url,
            "olid": book_data.get("key", "").replace("/works/", ""),
            "first_publish_year": book_data.get("first_publish_year", None),
        }

    except Exception as e:
        print("Error fetching book:", e)
        return None
