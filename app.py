import os
import sqlite3
from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from tensorflow.keras.models import model_from_json
from flask_cors import CORS
import serial

app = Flask(__name__)
CORS(app)

ARDUINO_PORT = 'COM3' # Replace 'COM3' with your Arduino's serial port

# Initialize Arduino connection
arduino = serial.Serial(ARDUINO_PORT, 9600)  

# Load the FaceNet model
json_file = open('keras-facenet-h5/model.json', 'r')
loaded_model_json = json_file.read()
json_file.close()
model = model_from_json(loaded_model_json)
model.load_weights('keras-facenet-h5/model.h5')
FRmodel = model

# Database setup
db_path = "users.db"

def initialize_db():
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                encoding TEXT NOT NULL
            )
        """)
        conn.commit()

initialize_db()

def add_user_to_db(username, encoding):
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO users (username, encoding) VALUES (?, ?)", (username, encoding))
            conn.commit()
        except sqlite3.IntegrityError:
            return False
    return True

def get_all_users_from_db():
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT username, encoding FROM users")
        return cursor.fetchall()

def img_to_encoding(image_path, model):
    img = tf.keras.preprocessing.image.load_img(image_path, target_size=(160, 160))
    img = np.around(np.array(img) / 255.0, decimals=12)
    x_train = np.expand_dims(img, axis=0)
    embedding = model.predict_on_batch(x_train)
    return embedding / np.linalg.norm(embedding, ord=2)

@app.route('/signup', methods=['POST'])
def signup():
    if 'username' not in request.form or 'image' not in request.files:
        return jsonify({'error': 'Username and Image file required'}), 400

    username = request.form['username']
    image_file = request.files['image']

    # Save img to temp location
    image_path = f"temp/{username}.jpg"
    os.makedirs("temp", exist_ok=True)
    image_file.save(image_path)

    # Generate encoding
    encoding = img_to_encoding(image_path, FRmodel).flatten()
    os.remove(image_path)  # Remove temp img

    # Store in db
    encoding_str = ",".join(map(str, encoding))
    if not add_user_to_db(username, encoding_str):
        return jsonify({'error': 'Username already exists'}), 400

    return jsonify({'message': 'Signup successful'}), 200



@app.route('/verify', methods=['POST'])
def verify():
    if 'image' not in request.files or 'camera' not in request.form:
        return jsonify({'error': 'Image file and camera parameter required'}), 400

    image_file = request.files['image']
    camera = request.form['camera']  # Camera parameter (A, B, or C)

    # Save img to a temp location
    image_path = "temp/verify.jpg"
    os.makedirs("temp", exist_ok=True)
    image_file.save(image_path)

    # Perform face recognition
    min_dist = 100
    identity = None
    encoding = img_to_encoding(image_path, FRmodel).flatten()
    os.remove(image_path)  # Remove temp img

    # Fetch all user encodings from DB
    users = get_all_users_from_db()
    for name, db_encoding in users:
        db_encoding = np.array(list(map(float, db_encoding.split(','))))
        dist = np.linalg.norm(db_encoding - encoding)
        if dist < min_dist:
            min_dist = dist
            identity = name

    if min_dist > 0.7 or identity is None:
        return jsonify({'message': 'Not recognized'}), 200
    else:
        # Check which camera was used and send appropriate command to Arduino
        if camera == 'A':
            arduino.write(b'OPEN_A\n') 
        elif camera == 'B':
            arduino.write(b'OPEN_B\n')  
        elif camera == 'C':
            arduino.write(b'OPEN_C\n') 
        else:
            return jsonify({'error': 'Invalid camera selected'}), 400

        return jsonify({'username': identity}), 200


if __name__ == '__main__':
    app.run(debug=True)
