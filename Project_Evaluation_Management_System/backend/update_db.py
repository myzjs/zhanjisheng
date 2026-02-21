from app import app
from extensions import db
import sqlite3

with app.app_context():
    # 连接到SQLite数据库
    conn = sqlite3.connect('project_evaluation.db')
    cursor = conn.cursor()
    
    # 检查是否存在course_duration列
    cursor.execute("PRAGMA table_info(training_courseware)")
    columns = [column[1] for column in cursor.fetchall()]
    
    # 如果不存在course_duration列，添加它
    if 'course_duration' not in columns:
        cursor.execute("ALTER TABLE training_courseware ADD COLUMN course_duration TEXT DEFAULT '1h'")
        print('添加了course_duration列')
    
    # 如果不存在enabled_status列，添加它
    if 'enabled_status' not in columns:
        cursor.execute("ALTER TABLE training_courseware ADD COLUMN enabled_status INTEGER DEFAULT 1")
        print('添加了enabled_status列')
    
    # 提交更改并关闭连接
    conn.commit()
    conn.close()
    print('数据库更新完成')
