import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hangman.db')

DEFAULT_WORDS = [
    # Programming (5 words)
    ('PYTHON', 'Programming', 'A popular high-level language named after a comedy group, not a snake.'),
    ('KOTLIN', 'Programming', 'Modern JVM language officially supported for Android app development.'),
    ('JAVA', 'Programming', 'Object-oriented language famous for "Write Once, Run Anywhere" philosophy.'),
    ('SWIFT', 'Programming', "Apple's powerful language for building iOS and macOS applications."),
    ('JAVASCRIPT', 'Programming', 'The language that makes websites interactive — runs in every browser.'),

    # Nature (5 words)
    ('FOREST', 'Nature', 'A large area covered chiefly with trees and undergrowth.'),
    ('MOUNTAIN', 'Nature', "A large natural elevation of the earth's surface rising abruptly."),
    ('RIVER', 'Nature', 'A large natural stream of water flowing in a channel to the sea.'),
    ('RAINBOW', 'Nature', 'An arch of colors visible in the sky, caused by refraction of sunlight.'),
    ('OCEAN', 'Nature', "A vast expanse of saltwater covering most of the Earth's surface."),

    # Fruit (5 words)
    ('APPLE', 'Fruit', 'A round fruit with red, green, or yellow skin and crisp white flesh.'),
    ('BANANA', 'Fruit', 'A long curved yellow tropical fruit with soft, sweet flesh inside.'),
    ('ORANGE', 'Fruit', 'A round juicy citrus fruit with a tough bright reddish-yellow rind.'),
    ('MANGO', 'Fruit', 'A fleshy oval yellowish-red tropical fruit known as the king of fruits.'),
    ('WATERMELON', 'Fruit', 'A large green-skinned melon with sweet red pulp and black seeds.'),
]

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS words")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            hint TEXT NOT NULL
        )
    ''')
    cursor.executemany(
        "INSERT OR IGNORE INTO words (word, category, hint) VALUES (?, ?, ?)",
        DEFAULT_WORDS
    )
    conn.commit()
    conn.close()

def get_categories():
    conn = get_db_connection()
    rows = conn.execute("SELECT DISTINCT category FROM words ORDER BY category").fetchall()
    conn.close()
    return [r['category'] for r in rows]

def get_random_word(category):
    conn = get_db_connection()
    row = conn.execute(
        "SELECT word, hint FROM words WHERE category = ? ORDER BY RANDOM() LIMIT 1",
        (category,)
    ).fetchone()
    conn.close()
    return (row['word'], row['hint']) if row else (None, None)

if __name__ == '__main__':
    init_db()
    print("Database initialized with 3 categories × 5 words!")
