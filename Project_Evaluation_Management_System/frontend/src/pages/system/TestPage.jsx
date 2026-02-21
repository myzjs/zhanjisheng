import React from 'react';

const TestPage = () => {
  return (
    <div style={{ padding: 24, backgroundColor: '#f5f5f5' }}>
      <h1 style={{ color: '#333' }}>测试页面</h1>
      <div style={{ backgroundColor: '#fff', padding: 20, borderRadius: 8 }}>
        <p>这是一个测试页面，用于验证React组件是否能够正常渲染。</p>
        <p>如果您看到此页面，则说明React组件渲染正常。</p>
      </div>
    </div>
  );
};

export default TestPage;