import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, message, 
  Popconfirm, Space, Typography
} from 'antd';
import axios from 'axios';

const { Option } = Select;
const { Title } = Typography;

const EvaluationType = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentType, setCurrentType] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // 获取评审类型列表
  const fetchTypes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/evaluation-types');
      setTypes(response.data);
    } catch (error) {
      message.error('获取评审类型失败');
      console.error('Error fetching evaluation types:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchTypes();
  }, []);

  // 打开新增评审类型模态框
  const showAddModal = () => {
    setCurrentType(null);
    setIsEditMode(false);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 打开编辑评审类型模态框
  const showEditModal = (type) => {
    setCurrentType(type);
    setIsEditMode(true);
    form.setFieldsValue(type);
    setIsModalVisible(true);
  };

  // 保存评审类型
  const handleSave = async (values) => {
    try {
      if (isEditMode) {
        // 更新评审类型
        await axios.put(`http://localhost:5001/api/evaluation-types/${currentType.id}`, values);
        message.success('评审类型更新成功');
      } else {
        // 创建评审类型
        await axios.post('http://localhost:5001/api/evaluation-types', values);
        message.success('评审类型创建成功');
      }
      setIsModalVisible(false);
      fetchTypes();
    } catch (error) {
      message.error(isEditMode ? '评审类型更新失败' : '评审类型创建失败');
      console.error('Error saving evaluation type:', error);
    }
  };

  // 删除评审类型
  const handleDelete = async (typeId) => {
    try {
      await axios.delete(`http://localhost:5001/api/evaluation-types/${typeId}`);
      message.success('评审类型删除成功');
      fetchTypes();
    } catch (error) {
      message.error('评审类型删除失败');
      console.error('Error deleting evaluation type:', error);
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
      title: '评审类型ID',
      dataIndex: 'evaluation_type_id',
      key: 'evaluation_type_id',
      width: 150,
    },
    {
      title: '评审类型',
      dataIndex: 'evaluation_type',
      key: 'evaluation_type',
      width: 200,
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
            title="确定要删除这个评审类型吗？"
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
    <div className="evaluation-type-management">
      <Title level={2}>评审类型管理</Title>
      
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" onClick={showAddModal}>
          新增评审类型
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={types}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
      
      <Modal
        title={isEditMode ? '编辑评审类型' : '新增评审类型'}
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
            name="evaluation_type_id"
            label="评审类型ID"
            rules={[{ required: true, message: '请输入评审类型ID' }]}
          >
            <Input placeholder="请输入评审类型ID" />
          </Form.Item>
          
          <Form.Item
            name="evaluation_type"
            label="评审类型"
            rules={[{ required: true, message: '请输入评审类型' }]}
          >
            <Input placeholder="请输入评审类型" />
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
                {isEditMode ? '保存修改' : '创建评审类型'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EvaluationType;