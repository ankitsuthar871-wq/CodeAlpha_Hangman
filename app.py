from flask import Flask, render_template, request, jsonify, session
import database, os

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'hangman_ultra_premium_2026')
database.init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/categories')
def categories():
    return jsonify({"success": True, "categories": database.get_categories()})

@app.route('/api/game/new', methods=['POST'])
def new_game():
    data = request.json or {}
    category = data.get('category', 'Programming')
    if category not in database.get_categories():
        category = 'Programming'
    word, hint = database.get_random_word(category)
    if not word:
        return jsonify({"success": False, "error": "No words found."}), 400
    session['word'] = word.upper()
    session['category'] = category
    session['hint'] = hint
    session['correct'] = []
    session['incorrect'] = []
    session['attempts'] = 6
    session['status'] = 'playing'
    return jsonify({
        "success": True,
        "category": category,
        "masked": ''.join(['_'] * len(word)),
        "length": len(word),
        "hint": hint,
        "attempts": 6,
        "status": "playing"
    })

@app.route('/api/game/guess', methods=['POST'])
def guess():
    if 'word' not in session or session.get('status') != 'playing':
        return jsonify({"success": False, "error": "No active game."}), 400
    data = request.json or {}
    letter = data.get('letter', '').strip().upper()
    if not letter or len(letter) != 1 or not letter.isalpha():
        return jsonify({"success": False, "error": "Invalid letter."}), 400

    word = session['word']
    correct = session['correct']
    incorrect = session['incorrect']
    attempts = session['attempts']

    if letter in correct or letter in incorrect:
        masked = ''.join([c if c in correct else '_' for c in word])
        return jsonify({"success": True, "duplicate": True, "hit": letter in word,
                        "masked": masked, "incorrect": incorrect, "attempts": attempts, "status": "playing"})

    hit = letter in word
    if hit:
        correct.append(letter)
    else:
        incorrect.append(letter)
        attempts -= 1

    session['correct'] = correct
    session['incorrect'] = incorrect
    session['attempts'] = attempts

    masked = ''.join([c if c in correct else '_' for c in word])
    if '_' not in masked:
        session['status'] = 'won'
        status = 'won'
    elif attempts <= 0:
        session['status'] = 'lost'
        status = 'lost'
    else:
        status = 'playing'

    resp = {"success": True, "duplicate": False, "hit": hit, "masked": masked,
            "incorrect": incorrect, "attempts": attempts, "status": status}
    if status in ('won', 'lost'):
        resp['word'] = word
    return jsonify(resp)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
