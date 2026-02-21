import React from 'react';
import { Button } from 'antd';

const TestQuestionnaire = () => {
  // 返回上一页
  const handleBack = () => {
    window.history.back();
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f5f5' }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button onClick={handleBack}>
            返回上一页
          </Button>
          <h1 style={{ color: '#333', margin: 0 }}>测试调研问卷管理</h1>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#fff', padding: 20, borderRadius: 8 }}>
        <p>这是一个测试页面，用于验证路由是否正常工作。</p>
        <p>如果您看到此页面，则说明路由和组件渲染是正常的。</p>
      </div>
    </div>
  );
};

export default TestQuestionnaire;