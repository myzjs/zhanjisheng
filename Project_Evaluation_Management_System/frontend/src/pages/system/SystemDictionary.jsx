import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, message,
  Popconfirm, Space, Typography, Upload
} from 'antd';
import {
  UploadOutlined, ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { Title } = Typography;

const SystemDictionary = () => {
  const [dictionaries, setDictionaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentDictionary, setCurrentDictionary] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  // 选中的行的ID
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // 获取系统字典列表
  const fetchDictionaries = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/system-dictionaries');
      setDictionaries(response.data);
    } catch (error) {
      message.error('获取系统字典失败');
      console.error('Error fetching system dictionaries:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchDictionaries();
  }, []);

  // 打开新增系统字典模态框
  const showAddModal = () => {
    setCurrentDictionary(null);
    setIsEditMode(false);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 打开编辑系统字典模态框
  const showEditModal = (dictionary) => {
    setCurrentDictionary(dictionary);
    setIsEditMode(true);
    form.setFieldsValue(dictionary);
    setIsModalVisible(true);
  };

  // 保存系统字典
  const handleSave = async (values) => {
    try {
      if (isEditMode) {
        // 更新系统字典
        await axios.put(`http://localhost:5001/api/system-dictionaries/${currentDictionary.id}`, values);
        message.success('系统字典更新成功');
      } else {
        // 创建系统字典
        await axios.post('http://localhost:5001/api/system-dictionaries', values);
        message.success('系统字典创建成功');
      }
      setIsModalVisible(false);
      fetchDictionaries();
    } catch (error) {
      message.error(isEditMode ? '系统字典更新失败' : '系统字典创建失败');
      console.error('Error saving system dictionary:', error);
    }
  };

  // 删除系统字典
  const handleDelete = async (dictionaryId) => {
    try {
      await axios.delete(`http://localhost:5001/api/system-dictionaries/${dictionaryId}`);
      message.success('系统字典删除成功');
      fetchDictionaries();
    } catch (error) {
      message.error('系统字典删除失败');
      console.error('Error deleting system dictionary:', error);
    }
  };
  
  // 批量删除系统字典
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.info('请先选择要删除的系统字典');
      return;
    }
    
    try {
      // 批量删除选中的系统字典
      const deletePromises = selectedRowKeys.map(id => 
        axios.delete(`http://localhost:5001/api/system-dictionaries/${id}`)
      );
      
      await Promise.all(deletePromises);
      message.success(`成功删除 ${selectedRowKeys.length} 条系统字典`);
      // 清空选中状态
      setSelectedRowKeys([]);
      // 刷新列表
      fetchDictionaries();
    } catch (error) {
      message.error('批量删除失败，请重试');
      console.error('Error batch deleting system dictionaries:', error);
    }
  };

  // 下载模版
  const handleDownloadTemplate = () => {
    // CSV表头
    const headers = ['system_name', 'remarks', 'enabled_status'];
    
    // 中文字段说明
    const chineseDescriptions = ['系统名称', '备注', '启用状态(1=启用,0=禁用)'];
    
    // 模板数据
    const templateData = ['', '', '1'];
    
    // 转换为CSV格式
    const csvContent = [
      headers.join(','),
      chineseDescriptions.join(','),
      templateData.join(',')
    ].join('\n');
    
    // 创建Blob对象
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'system_dictionary_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    message.success('模版下载成功');
  };

  // 导入数据
  const handleImportData = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5001/api/system-dictionaries/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      message.success('数据导入成功');
      fetchDictionaries();
      return false; // 阻止自动上传
    } catch (error) {
      message.error('数据导入失败');
      return false;
    }
  };

  // 列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '系统名称',
      dataIndex: 'system_name',
      key: 'system_name',
      width: 200,
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'enabled_status',
      key: 'enabled_status',
      width: 100,
      render: (status) => (
        <span>{status === 1 ? '启用' : '禁用'}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => showEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个系统字典吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="system-dictionary-management">
      <Title level={2}>系统字典管理</Title>
      
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Popconfirm
            title={`确定要删除选中的 ${selectedRowKeys.length} 条系统字典吗？`}
            onConfirm={handleBatchDelete}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              danger 
              disabled={selectedRowKeys.length === 0}
            >
              批量删除
            </Button>
          </Popconfirm>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="primary" onClick={showAddModal}>
            新增系统字典
          </Button>
          <Button onClick={handleDownloadTemplate}>
            下载模版
          </Button>
          <Upload
            name="file"
            multiple={false}
            accept=".csv"
            beforeUpload={handleImportData}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>
              导入数据
            </Button>
          </Upload>
          <Button icon={<ReloadOutlined />} onClick={fetchDictionaries} loading={loading}>
            刷新
          </Button>
        </div>
      </div>
      
      <Table
        columns={columns}
        dataSource={dictionaries}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
          checkboxColumn: {
            width: 40,
          },
        }}
      />
      
      <Modal
        title={isEditMode ? '编辑系统字典' : '新增系统字典'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="system_name"
            label="系统名称"
            rules={[{ required: true, message: '请输入系统名称' }]}
          >
            <Input placeholder="请输入系统名称" />
          </Form.Item>
          
          <Form.Item
            name="remarks"
            label="备注"
          >
            <Input.TextArea placeholder="请输入备注信息" rows={4} />
          </Form.Item>
          
          <Form.Item
            name="enabled_status"
            label="状态"
            initialValue={1}
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {isEditMode ? '保存修改' : '创建系统字典'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemDictionary;