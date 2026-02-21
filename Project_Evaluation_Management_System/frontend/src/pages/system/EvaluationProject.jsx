import { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, DatePicker, Upload, Row, Col,
  message, Space, Typography, Popconfirm
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, UploadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { pinyin } from 'pinyin-pro';

const { Title } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

const EvaluationProject = () => {
  const navigate = useNavigate();
  // 状态管理
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedProject, setSelectedProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [evaluationTypes, setEvaluationTypes] = useState([]);
  const [evaluationLevels, setEvaluationLevels] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // 获取数据
  useEffect(() => {
    fetchProjects();
    fetchUsers();
    fetchEvaluationTypes();
    fetchEvaluationLevels();
  }, []);

  // 获取评审项目列表
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/evaluation-projects');
      setProjects(response.data);
    } catch (error) {
      message.error('获取评审项目失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/users');
      setUsers(response.data);
    } catch (error) {
      message.error('获取用户列表失败');
    }
  };

  // 获取评审类型列表
  const fetchEvaluationTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/evaluation-types');
      setEvaluationTypes(response.data);
    } catch (error) {
      message.error('获取评审类型失败');
    }
  };

  // 获取评审级别列表
  const fetchEvaluationLevels = async (evaluationTypeID = null) => {
    try {
      let url = 'http://localhost:5001/api/evaluation-levels';
      if (evaluationTypeID) {
        url += `?evaluation_type_id=${evaluationTypeID}`;
      }
      const response = await axios.get(url);
      setEvaluationLevels(response.data);
    } catch (error) {
      message.error('获取评审级别失败');
    }
  };

  // 处理文件上传
  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5001/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadFile(response.data.url);
      message.success('文件上传成功');
      return false; // 阻止自动上传
    } catch (error) {
      message.error('文件上传失败');
      return false;
    }
  };

  // 预览图片
  const handlePreview = (file) => {
    setPreviewImage(file.url || file.thumbUrl);
    setPreviewVisible(true);
  };

  // 打开添加模态框
  const handleAdd = () => {
    setModalType('add');
    setSelectedProject(null);
    setUploadFile(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑模态框
  const handleEdit = (project) => {
    setModalType('edit');
    setSelectedProject(project);
    setUploadFile(project.establishment_proof);
    form.setFieldsValue(project);
    setModalVisible(true);
  };

  // 生成项目ID
  const generateProjectId = (projectName) => {
    // 使用项目名称的拼音首字母（大写）加上时间戳的后6位
    const namePrefix = pinyin(projectName, {
      pattern: 'first',
      toneType: 'none',
      removeNonZh: true
    }).substring(0, 4);
    
    const timestamp = Date.now().toString().substring(8);
    return `${namePrefix}${timestamp}`;
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 构建请求数据，处理日期格式
      const data = {
        ...values,
        establishment_date: values.establishment_date ? values.establishment_date.toISOString() : null,
        establishment_proof: uploadFile,
      };

      if (modalType === 'add') {
        // 为新项目生成project_id
        data.project_id = generateProjectId(values.project_name);
        // 创建新项目
        const response = await axios.post('http://localhost:5001/api/evaluation-projects', data);
        message.success('创建评审项目成功');
      } else {
        // 更新项目时保持原有的project_id
        if (selectedProject.project_id) {
          data.project_id = selectedProject.project_id;
        } else {
          // 如果原项目没有project_id，为其生成一个
          data.project_id = generateProjectId(values.project_name);
        }
        await axios.put(`http://localhost:5001/api/evaluation-projects/${selectedProject.id}`, data);
        message.success('更新评审项目成功');
      }

      // 关闭模态框并刷新数据
      setModalVisible(false);
      fetchProjects();
    } catch (error) {
      console.error('提交失败:', error);
      if (error.response) {
        console.error('响应数据:', error.response.data);
        console.error('响应状态:', error.response.status);
      }
      message.error('操作失败，请重试');
    }
  };

  // 删除评审项目
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/api/evaluation-projects/${id}`);
      message.success('删除评审项目成功');
      fetchProjects();
    } catch (error) {
      message.error('删除失败，请重试');
    }
  };

  // 处理分页变化
  const handlePaginationChange = (current, pageSize) => {
    setPagination({
      current,
      pageSize,
    });
  };

  // 返回上一页
  const handleBack = () => {
    window.history.back();
  };

  // 列定义
  const columns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 200,
      sorter: (a, b) => a.project_name.localeCompare(b.project_name),
      sortDirections: ['ascend', 'descend', 'reset'],
    },
    {
      title: '项目类型',
      dataIndex: 'project_type_name',
      key: 'project_type_name',
      width: 150,
      sorter: (a, b) => a.project_type_name.localeCompare(b.project_type_name),
      sortDirections: ['ascend', 'descend', 'reset'],
    },
    {
      title: '项目级别',
      dataIndex: 'project_level_name',
      key: 'project_level_name',
      width: 120,
      sorter: (a, b) => a.project_level_name.localeCompare(b.project_level_name),
      sortDirections: ['ascend', 'descend', 'reset'],
    },
    {
      title: '立项日期',
      dataIndex: 'establishment_date',
      key: 'establishment_date',
      width: 120,
      sorter: (a, b) => new Date(a.establishment_date) - new Date(b.establishment_date),
      sortDirections: ['ascend', 'descend', 'reset'],
      render: (date) => {
        if (!date) return '-';
        // 格式化日期为年月日格式
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      },
    },
    {
      title: '评审项目经理',
      dataIndex: 'project_manager_name',
      key: 'project_manager_name',
      width: 150,
      sorter: (a, b) => a.project_manager_name.localeCompare(b.project_manager_name),
      sortDirections: ['ascend', 'descend', 'reset'],
    },
    {
      title: '现场项目经理',
      dataIndex: 'site_project_manager_name',
      key: 'site_project_manager_name',
      width: 150,
      sorter: (a, b) => {
        if (!a.site_project_manager_name) return 1;
        if (!b.site_project_manager_name) return -1;
        return a.site_project_manager_name.localeCompare(b.site_project_manager_name);
      },
      sortDirections: ['ascend', 'descend', 'reset'],
    },
    {
      title: '项目属性',
      dataIndex: 'project_attribute',
      key: 'project_attribute',
      width: 100,
      sorter: (a, b) => a.project_attribute.localeCompare(b.project_attribute),
      sortDirections: ['ascend', 'descend', 'reset'],
    },
    {
      title: '立项状态',
      dataIndex: 'establishment_status',
      key: 'establishment_status',
      width: 100,
      sorter: (a, b) => a.establishment_status.localeCompare(b.establishment_status),
      sortDirections: ['ascend', 'descend', 'reset'],
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
          <Button 
            icon={<PlusOutlined />} 
            size="small" 
            onClick={() => navigate(`/project/research-form?project_id=${record.id}`)}
          >
            新增调研
          </Button>
          <Popconfirm
            title="确定要删除这个评审项目吗？"
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

  // 上传配置
  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: 'image/*',
    maxCount: 1,
    beforeUpload: handleUpload,
    onPreview: handlePreview,
    fileList: uploadFile ? [{
      uid: '1',
      name: 'establishment_proof.jpg',
      status: 'done',
      url: uploadFile,
    }] : [],
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  return (
    <div style={{ padding: 24, minHeight: '400px', backgroundColor: '#f5f5f5' }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button onClick={handleBack}>
            返回上一页
          </Button>
          <h1 style={{ color: '#333', margin: 0 }}>评审项目管理</h1>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#fff', padding: 20, borderRadius: 8, marginBottom: 20 }}>
        <p>当前评审项目数量: {projects.length}</p>
        <p>加载状态: {loading ? '加载中' : '已加载'}</p>
        
        <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增评审项目
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchProjects} loading={loading}>
            刷新
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: handlePaginationChange,
          }}
          scroll={{
            x: 1200,
          }}
        />
      </div>

      {/* 模态框 */}
      <Modal
        title={modalType === 'add' ? '新增评审项目' : '编辑评审项目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: '100%' }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="project_name"
                label="项目名称"
                rules={[{ required: true, message: '请输入项目名称' }]}
              >
                <Input placeholder="请输入项目名称" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="project_manager_id"
                label="评审项目经理"
                rules={[{ required: true, message: '请选择评审项目经理' }]}
              >
                <Select placeholder="请选择评审项目经理">
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>{user.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="site_project_manager_id"
                label="现场项目经理"
              >
                <Select placeholder="请选择现场项目经理" allowClear>
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>{user.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="project_type"
                label="项目类型"
                rules={[{ required: true, message: '请选择项目类型' }]}
              >
                <Select placeholder="请选择项目类型">
                  {evaluationTypes.map(type => (
                    <Option key={type.id} value={type.id}>{type.evaluation_type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="project_level"
                label="项目级别"
                rules={[{ required: true, message: '请选择项目级别' }]}
              >
                <Select placeholder="请选择项目级别">
                  {evaluationLevels.map(level => (
                    <Option key={level.id} value={level.id}>{level.evaluation_level}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="project_attribute"
                label="项目属性"
                rules={[{ required: true, message: '请选择项目属性' }]}
              >
                <Select>
                  <Option value="标准">标准</Option>
                  <Option value="非标">非标</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="establishment_status"
                label="立项状态"
                rules={[{ required: true, message: '请选择立项状态' }]}
              >
                <Select>
                  <Option value="立项">立项</Option>
                  <Option value="待定">待定</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="establishment_date"
                label="立项日期"
                rules={[{ required: true, message: '请选择立项日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="立项证明"
              >
                <Dragger {...uploadProps}>
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="ant-upload-hint">
                    支持 JPG、JPEG 等图片格式，单个文件大小不超过 50MB
                  </p>
                </Dragger>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 图片预览 */}
      {previewVisible && (
        <Modal
          open={previewVisible}
          footer={null}
          onCancel={() => setPreviewVisible(false)}
        >
          <img alt="预览" style={{ width: '100%' }} src={previewImage} />
        </Modal>
      )}
    </div>
  );
};

export default EvaluationProject;