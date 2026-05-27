import os
import uuid
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH  = os.path.join(BASE_DIR, 'db', 'product.db')

app = Flask(__name__, static_folder=BASE_DIR)

# ── 数据库初始化 ─────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id       TEXT PRIMARY KEY,
            name     TEXT NOT NULL,
            cat      TEXT NOT NULL,
            "desc"   TEXT NOT NULL,
            spec     TEXT DEFAULT '',
            material TEXT DEFAULT '',
            status   TEXT DEFAULT '上架',
            detail   TEXT DEFAULT '',
            img      TEXT DEFAULT '',
            created_at TEXT
        )
    ''')
    conn.commit()
    conn.close()

# ── 静态文件 ─────────────────────────────────────────────────────────────────

@app.route('/')
def root():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(BASE_DIR, path)

# ── API：产品列表 / 新建 ──────────────────────────────────────────────────────

@app.route('/api/products', methods=['GET'])
def list_products():
    status = request.args.get('status')
    conn = get_db()
    if status:
        rows = conn.execute(
            'SELECT * FROM products WHERE status=? ORDER BY created_at DESC', (status,)
        ).fetchall()
    else:
        rows = conn.execute(
            'SELECT * FROM products ORDER BY created_at DESC'
        ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/products', methods=['POST'])
def create_product():
    data = request.get_json(force=True)
    if not data.get('name') or not data.get('cat') or not data.get('desc'):
        return jsonify({'error': '缺少必填字段'}), 400
    pid = uuid.uuid4().hex[:16]
    now = datetime.now().isoformat(timespec='seconds')
    conn = get_db()
    conn.execute(
        'INSERT INTO products (id,name,cat,"desc",spec,material,status,detail,img,created_at) '
        'VALUES (?,?,?,?,?,?,?,?,?,?)',
        (pid, data['name'], data['cat'], data['desc'],
         data.get('spec',''), data.get('material',''),
         data.get('status','上架'), data.get('detail',''),
         data.get('img',''), now)
    )
    conn.commit()
    row = conn.execute('SELECT * FROM products WHERE id=?', (pid,)).fetchone()
    conn.close()
    return jsonify(dict(row)), 201

# ── API：单个产品 获取 / 更新 / 删除 ─────────────────────────────────────────

@app.route('/api/products/<pid>', methods=['GET'])
def get_product(pid):
    conn = get_db()
    row = conn.execute('SELECT * FROM products WHERE id=?', (pid,)).fetchone()
    conn.close()
    if not row:
        return jsonify({'error': '产品不存在'}), 404
    return jsonify(dict(row))

@app.route('/api/products/<pid>', methods=['PUT'])
def update_product(pid):
    data = request.get_json(force=True)
    conn = get_db()
    conn.execute(
        'UPDATE products SET name=?,cat=?,"desc"=?,spec=?,material=?,status=?,detail=?,img=? WHERE id=?',
        (data['name'], data['cat'], data['desc'],
         data.get('spec',''), data.get('material',''),
         data.get('status','上架'), data.get('detail',''),
         data.get('img',''), pid)
    )
    conn.commit()
    row = conn.execute('SELECT * FROM products WHERE id=?', (pid,)).fetchone()
    conn.close()
    if not row:
        return jsonify({'error': '产品不存在'}), 404
    return jsonify(dict(row))

@app.route('/api/products/<pid>', methods=['DELETE'])
def delete_product(pid):
    conn = get_db()
    conn.execute('DELETE FROM products WHERE id=?', (pid,))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

# ── 启动 ─────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_db()
    print('✅ 数据库已就绪：', DB_PATH)
    print('🚀 服务启动：http://localhost:8080')
    app.run(debug=False, port=8080)
