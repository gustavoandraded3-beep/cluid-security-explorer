from flask import Flask, request, jsonify
import io
import sys
import os

# Make sure parser.py in same directory is importable
sys.path.insert(0, os.path.dirname(__file__))
from parser import parse_excel

app = Flask(__name__)

def cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@app.after_request
def after_request(response):
    return cors(response)

@app.route('/api/upload', methods=['POST', 'OPTIONS'])
def upload_file():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    f = request.files['file']
    if not f.filename.endswith('.xlsx'):
        return jsonify({'error': 'Only .xlsx files are supported'}), 400
    
    try:
        contents = f.read()
        parsed = parse_excel(io.BytesIO(contents))
        return jsonify({
            'success': True,
            'data': parsed,
            'summary': {
                'roles': len(parsed.get('roles', {})),
                'teams': len(parsed.get('teams', [])),
                'total_assignments': len(parsed.get('role_assignments', [])),
            }
        })
    except Exception as e:
        return jsonify({'error': f'Failed to parse file: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})
