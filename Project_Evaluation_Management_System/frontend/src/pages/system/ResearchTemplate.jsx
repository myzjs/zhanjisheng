import { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, Upload, Row, Col,
  message, Space, Card, Typography, Popconfirm 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, UploadOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

const ResearchTemplate = () => {
  // 状态管理
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [evaluationTypes, setEvaluationTypes] = useState([]);
  const [evaluationLevels, setEvaluationLevels] = useState([]);
  const [clauses, setClauses] = useState([]);
  const [businessProjects, setBusinessProjects] = useState([]);
  const [systemDictionaries, setSystemDictionaries] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // 调试信息
  console.log('ResearchTemplate component rendered');
  console.log('Current templates:', templates);
  console.log('Current loading state:', loading);

  // 获取数据
  useEffect(() => {
    fetchTemplates();
    fetchEvaluationTypes();
    fetchEvaluationLevels();
    fetchClauses();
    fetchBusinessProjects();
    fetchSystemDictionaries();
  }, []);

  // 获取业务项目列表
  const fetchBusinessProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/emr-standard-clauses/business-projects');
      setBusinessProjects(response.data);
    } catch (error) {
      message.error('获取业务项目失败');
      console.error('Error fetching business projects:', error);
    }
  };

  // 获取系统字典表列表
  const fetchSystemDictionaries = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/system-dictionaries');
      setSystemDictionaries(response.data);
    } catch (error) {
      message.error('获取系统字典表失败');
    }
  };

  // 获取调研模板列表
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/research-templates');
      setTemplates(response.data);
    } catch (error) {
      message.error('获取调研模板失败');
    } finally {
      setLoading(false);
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
      console.error('Error fetching evaluation levels:', error);
    }
  };

  // 获取EMR标准条款列表
  const fetchClauses = async (businessProject = null, numericLevel = null) => {
    try {
      let url = 'http://localhost:5001/api/emr-standard-clauses';
      const params = [];
      if (businessProject) {
        params.push(`business_project=${encodeURIComponent(businessProject)}`);
      }
      if (numericLevel) {
        params.push(`function_score=${numericLevel}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const response = await axios.get(url);
      setClauses(response.data);
      console.log('Fetched clauses with businessProject:', businessProject, 'and numericLevel:', numericLevel);
      console.log('Clauses received:', response.data);
    } catch (error) {
      message.error('获取EMR标准条款失败');
      console.error('Error fetching clauses:', error);
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
    setSelectedTemplate(null);
    setUploadFile(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑模态框
  const handleEdit = (template) => {
    setModalType('edit');
    setSelectedTemplate(template);
    setUploadFile(template.reference_screenshot);
    form.setFieldsValue(template);
    setModalVisible(true);
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 构建请求数据
      const data = {
        ...values,
        reference_screenshot: uploadFile,
      };

      if (modalType === 'add') {
        // 创建新调研模板
        const response = await axios.post('http://localhost:5001/api/research-templates', data);
        message.success('创建调研模板成功');
      } else {
        // 更新调研模板
        await axios.put(`http://localhost:5001/api/research-templates/${selectedTemplate.id}`, data);
        message.success('更新调研模板成功');
      }

      // 关闭模态框并刷新数据
      setModalVisible(false);
      fetchTemplates();
    } catch (error) {
      console.error('提交失败:', error);
      message.error('操作失败，请重试');
    }
  };

  // 删除调研模板
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/api/research-templates/${id}`);
      message.success('删除调研模板成功');
      fetchTemplates();
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

  // 下载模版
  const handleDownloadTemplate = () => {
    // CSV表头 - 与实际表结构一致
    const headers = ['project_category', 'project_level', 'system_name', 'standard_requirement', 'requirement_type', 'inspection_project', 'reference_screenshot', 'remarks', 'clause_id', 'enabled_status'];
    
    // 中文字段说明
    const chineseDescriptions = ['项目类别ID(evaluation_type_id)', '项目级别ID', '系统名称ID', '标准要求', '要求类型', '考察项目', '参考截图URL', '备注说明', '标准条款ID', '启用状态(1=启用,0=禁用)'];
    
    // 模板数据
    const templateData = ['', '', '', '', '功能要求', '', '', '', '', '1'];
    
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
    link.download = 'research_template_template.csv';
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
      const response = await axios.post('http://localhost:5001/api/research-templates/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      message.success('数据导入成功');
      fetchTemplates();
      return false; // 阻止自动上传
    } catch (error) {
      message.error('数据导入失败');
      return false;
    }
  };

  // 列定义
  const columns = [

    {
      title: '项目类别',
      dataIndex: 'project_category_name',
      key: 'project_category_name',
      width: 150,
    },
    {
      title: '项目级别',
      dataIndex: 'project_level_name',
      key: 'project_level_name',
      width: 120,
    },
    {
      title: '系统名称',
      dataIndex: 'system_name_name',
      key: 'system_name_name',
      width: 150,
    },
    {
      title: '标准要求',
      dataIndex: 'standard_requirement',
      key: 'standard_requirement',
      ellipsis: true,
      width: 300,
    },
    {
      title: '要求类型',
      dataIndex: 'requirement_type',
      key: 'requirement_type',
      width: 120,
    },
    {
      title: '考察项目',
      dataIndex: 'inspection_project',
      key: 'inspection_project',
      ellipsis: true,
      width: 200,
    },
    {
      title: '参考截图',
      dataIndex: 'reference_screenshot',
      key: 'reference_screenshot',
      width: 150,
      render: (screenshot) => {
        if (!screenshot) return '-';
        return (
          <a href={screenshot} target="_blank" rel="noopener noreferrer">
            查看截图
          </a>
        );
      },
    },
    {
      title: '备注说明',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
      width: 200,
    },
    {
      title: '对应标准条款',
      dataIndex: 'clause_id',
      key: 'clause_id',
      width: 150,
    },
    {
      title: '启用状态',
      dataIndex: 'enabled_status',
      key: 'enabled_status',
      width: 100,
      render: (status) => status === 1 ? '启用' : '禁用',
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
            title="确定要删除这个调研模板吗？"
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
      name: 'reference_screenshot.jpg',
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
          <h1 style={{ color: '#333', margin: 0 }}>调研模板管理</h1>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#fff', padding: 20, borderRadius: 8, marginBottom: 20 }}>
        <p>当前调研模板数量: {templates.length}</p>
        <p>加载状态: {loading ? '加载中' : '已加载'}</p>
        
        <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增调研模板
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
          <Button icon={<ReloadOutlined />} onClick={fetchTemplates} loading={loading}>
            刷新
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={templates}
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
        title={modalType === 'add' ? '新增调研模板' : '编辑调研模板'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={900}
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          initialValues={{
            enabled_status: 1,
          }}
          style={{ maxWidth: '100%' }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
            name="project_category"
            label="项目类别"
            rules={[{ required: true, message: '请选择项目类别' }]}
          >
            <Select 
              placeholder="请选择项目类别"
              onChange={(value) => {
                console.log('Project category changed:', value);
                // 当项目类别变化时，根据选中的类别ID重新获取项目级别列表
                fetchEvaluationLevels(value);
                // 清空项目级别选择
                form.setFieldsValue({ project_level: undefined });
              }}
            >
              {evaluationTypes.map(type => (
                <Option key={type.id} value={type.evaluation_type_id}>{type.evaluation_type}</Option>
              ))}
            </Select>
          </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="project_level"
                label="项目级别"
                rules={[{ required: true, message: '请选择项目级别' }]}
              >
                <Select 
                  placeholder="请选择项目级别"
                  onChange={(value) => {
                    console.log('Project level changed:', value);
                    // 当项目级别变化时，获取选中级别的数字级别
                    const selectedLevel = evaluationLevels.find(level => level.id === value);
                    const numericLevel = selectedLevel ? selectedLevel.numeric_level : null;
                    console.log('Selected level numeric value:', numericLevel);
                    
                    // 获取当前选中的考察项目
                    const inspectionProject = form.getFieldValue('inspection_project');
                    console.log('Current inspection project:', inspectionProject);
                    
                    // 根据考察项目和数字级别筛选标准条款
                    fetchClauses(inspectionProject, numericLevel);
                    // 清空标准条款选择
                    form.setFieldsValue({ clause_id: undefined });
                  }}
                >
                  {evaluationLevels.map(level => (
                    <Option key={level.id} value={level.id}>{level.evaluation_level}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="system_name"
                label="系统名称"
              >
                <Select placeholder="请选择系统名称" allowClear>
                  {systemDictionaries.map(dict => (
                    <Option key={dict.id} value={dict.id}>{dict.system_name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="requirement_type"
                label="要求类型"
                rules={[{ required: true, message: '请选择要求类型' }]}
              >
                <Select>
                  <Option value="功能要求">功能要求</Option>
                  <Option value="应用量要求">应用量要求</Option>
                  <Option value="其它要求">其它要求</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="inspection_project"
                label="考察项目"
                rules={[{ required: true, message: '请选择考察项目' }]}
              >
                <Select placeholder="请选择考察项目" onChange={(value) => {
                  console.log('Inspection project changed:', value);
                  // 当考察项目变化时，获取当前选中的项目级别
                  const projectLevelId = form.getFieldValue('project_level');
                  const selectedLevel = evaluationLevels.find(level => level.id === projectLevelId);
                  const numericLevel = selectedLevel ? selectedLevel.numeric_level : null;
                  console.log('Current project level numeric value:', numericLevel);
                  
                  // 根据考察项目和数字级别筛选标准条款
                  fetchClauses(value, numericLevel);
                  // 清空标准条款选择
                  form.setFieldsValue({ clause_id: undefined });
                }}>
                  {businessProjects.map(project => (
                    <Option key={project.value} value={project.value}>{project.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="clause_id"
                label="对应标准条款ID"
              >
                <Select placeholder="请选择对应标准条款" allowClear>
                  {clauses.map(clause => (
                    <Option key={clause.id} value={clause.id}>{clause.business_project}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
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
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="standard_requirement"
                label="标准要求"
                rules={[{ required: true, message: '请输入标准要求' }]}
              >
                <Input.TextArea 
                  placeholder="请输入标准要求" 
                  rows={4}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="参考截图"
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
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="remarks"
                label="备注说明"
              >
                <Input.TextArea 
                  placeholder="请输入备注说明" 
                  rows={3}
                />
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

export default ResearchTemplate;