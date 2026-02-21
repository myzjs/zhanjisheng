import { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, 
  message, Space, Card, Typography, Popconfirm 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;

const StandardCatalog = () => {
  // 状态管理
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedCatalog, setSelectedCatalog] = useState(null);

  // 获取数据
  useEffect(() => {
    fetchCatalogs();
  }, []);

  // 获取规范目录列表
  const fetchCatalogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/standard-catalogs');
      setCatalogs(response.data);
    } catch (error) {
      message.error('获取规范目录失败');
    } finally {
      setLoading(false);
    }
  };

  // 打开添加模态框
  const handleAdd = () => {
    setModalType('add');
    setSelectedCatalog(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑模态框
  const handleEdit = (catalog) => {
    setModalType('edit');
    setSelectedCatalog(catalog);
    form.setFieldsValue(catalog);
    setModalVisible(true);
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (modalType === 'add') {
        // 创建新规范目录
        const response = await axios.post('http://localhost:5001/api/standard-catalogs', values);
        message.success('创建规范目录成功');
      } else {
        // 更新规范目录
        await axios.put(`http://localhost:5001/api/standard-catalogs/${selectedCatalog.id}`, values);
        message.success('更新规范目录成功');
      }

      // 关闭模态框并刷新数据
      setModalVisible(false);
      fetchCatalogs();
    } catch (error) {
      console.error('提交失败:', error);
      message.error('操作失败，请重试');
    }
  };

  // 删除规范目录
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/api/standard-catalogs/${id}`);
      message.success('删除规范目录成功');
      fetchCatalogs();
    } catch (error) {
      message.error('删除失败，请重试');
    }
  };

  // 列定义
  const columns = [
    {
      title: '规范名称',
      dataIndex: 'standard_name',
      key: 'standard_name',
      ellipsis: true,
    },
    {
      title: '规范简称',
      dataIndex: 'standard_short_name',
      key: 'standard_short_name',
      width: 150,
    },
    {
      title: '规范助记符',
      dataIndex: 'mnemonic',
      key: 'mnemonic',
      width: 100,
    },
    {
      title: '规范内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 300,
    },
    {
      title: '启用状态',
      dataIndex: 'enabled_status',
      key: 'enabled_status',
      width: 100,
      render: (status) => status === 1 ? '启用' : '禁用',
    },
    {
      title: '规范版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个规范目录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              icon={<DeleteOutlined />} 
              size="small" 
              danger
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space direction="horizontal" size="middle">
          <Title level={4} style={{ margin: 0 }}>规范目录管理</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
          >
            新增规范目录
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchCatalogs}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      }
      style={{ marginBottom: 24 }}
    >
      <Table
        columns={columns}
        dataSource={catalogs}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{
          x: 1000,
        }}
      />

      {/* 模态框 */}
      <Modal
        title={modalType === 'add' ? '新增规范目录' : '编辑规范目录'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            enabled_status: 1,
            version: '1.0',
          }}
        >
          <Form.Item
            name="standard_name"
            label="规范名称"
            rules={[{ required: true, message: '请输入规范名称' }]}
          >
            <Input placeholder="请输入规范名称" />
          </Form.Item>

          <Form.Item
            name="standard_short_name"
            label="规范简称"
            rules={[{ required: true, message: '请输入规范简称' }]}
          >
            <Input placeholder="请输入规范简称" />
          </Form.Item>

          <Form.Item
            name="mnemonic"
            label="规范助记符"
            rules={[{ required: true, message: '请输入规范助记符' }]}
          >
            <Input placeholder="请输入规范助记符" />
          </Form.Item>

          <Form.Item
            name="content"
            label="规范内容"
            rules={[{ required: true, message: '请输入规范内容' }]}
          >
            <Input.TextArea 
              placeholder="请输入规范内容" 
              rows={4}
            />
          </Form.Item>

          <Form.Item
            name="enabled_status"
            label="启用状态"
            rules={[{ required: true, message: '请选择启用状态' }]}
          >
            <Select>
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="version"
            label="规范版本"
            rules={[{ required: true, message: '请输入规范版本' }]}
          >
            <Input placeholder="请输入规范版本" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default StandardCatalog;