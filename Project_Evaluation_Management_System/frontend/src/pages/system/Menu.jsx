import { useState, useEffect } from 'react';
import { Table, Button, Form, Input, Select, Modal, message, TreeSelect, InputNumber, Space, Upload, Image } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const MenuManagement = () => {
  const [menus, setMenus] = useState([]);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); // 操作历史记录
  const [iconFile, setIconFile] = useState(null); // 上传的图标文件
  const [iconUrl, setIconUrl] = useState(''); // 图标预览URL

  // 记录操作历史
  const addHistory = (action, data) => {
    const newHistory = [...history, { action, data, timestamp: Date.now() }];
    // 最多保留10步操作
    if (newHistory.length > 10) {
      newHistory.shift();
    }
    setHistory(newHistory);
  };

  // 清理图标上传状态
  const clearIconUpload = () => {
    setIconFile(null);
    setIconUrl('');
  };

  // 图片上传前的验证
  const handleBeforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过2MB！');
      return false;
    }
    return true;
  };

  // 图片上传完成的处理
  const handleUpload = (info) => {
    if (info.file) {
      // 读取文件并转换为base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result;
        setIconUrl(base64Url);
        setIconFile(info.file);
        // 将base64编码的图片设置到表单的icon字段
        form.setFieldsValue({ icon: base64Url });
        message.success(`${info.file.name} 上传成功`);
      };
      reader.readAsDataURL(info.file.originFileObj);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败`);
    }
  };

  // 撤销操作
  const handleUndo = async () => {
    if (history.length === 0) {
      message.info('没有可撤销的操作');
      return;
    }

    const lastAction = history[history.length - 1];
    setLoading(true);
    try {
      switch (lastAction.action) {
        case 'add':
          // 撤销添加操作：删除刚添加的菜单
          await axios.delete(`http://localhost:5001/api/menus/${lastAction.data.id}`);
          message.success('已撤销添加操作');
          break;
        case 'update':
          // 撤销更新操作：恢复之前的菜单数据
          await axios.put(`http://localhost:5001/api/menus/${lastAction.data.id}`, lastAction.data.oldData);
          message.success('已撤销更新操作');
          break;
        case 'delete':
          // 撤销删除操作：重新添加被删除的菜单
          await axios.post('http://localhost:5001/api/menus', lastAction.data);
          message.success('已撤销删除操作');
          break;
        default:
          break;
      }
      // 移除已撤销的操作记录
      setHistory(history.slice(0, -1));
      // 重新获取菜单列表
      fetchMenus();
    } catch (error) {
      message.error('撤销操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取菜单列表
  const fetchMenus = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/menus');
      setMenus(response.data);
    } catch (error) {
      message.error('获取菜单失败');
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // 打开新增菜单模态框
  const handleAddMenu = () => {
    setEditingMenu(null);
    form.resetFields();
    clearIconUpload();
    setIsModalVisible(true);
  };

  // 打开编辑菜单模态框
  const handleEditMenu = (menu) => {
    setEditingMenu(menu);
    form.setFieldsValue(menu);
    // 设置图标预览
    if (menu.icon && menu.icon.startsWith('data:image') || menu.icon.startsWith('http')) {
      setIconUrl(menu.icon);
      setIconFile(null);
    } else {
      clearIconUpload();
    }
    setIsModalVisible(true);
  };

  // 删除菜单
  const handleDeleteMenu = async (menuId) => {
    try {
      // 查找要删除的菜单数据，用于撤销操作
      const menuToDelete = findMenuById(menus, menuId);
      if (menuToDelete) {
        await axios.delete(`http://localhost:5001/api/menus/${menuId}`);
        message.success('菜单删除成功');
        // 记录操作历史
        addHistory('delete', menuToDelete);
      }
      fetchMenus();
    } catch (error) {
      message.error('菜单删除失败');
    }
  };

  // 根据ID查找菜单
  const findMenuById = (menuList, menuId) => {
    for (const menu of menuList) {
      if (menu.id === menuId) {
        return menu;
      }
      if (menu.children && menu.children.length > 0) {
        const found = findMenuById(menu.children, menuId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  // 提交菜单表单
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingMenu) {
        // 更新菜单
        // 记录更新前的数据，用于撤销操作
        const oldData = {
          id: editingMenu.id,
          name: editingMenu.name,
          path: editingMenu.path,
          icon: editingMenu.icon,
          parent_id: editingMenu.parent_id,
          order: editingMenu.order,
          visible: editingMenu.visible
        };
        await axios.put(`http://localhost:5001/api/menus/${editingMenu.id}`, values);
        message.success('菜单更新成功');
        // 记录操作历史
        addHistory('update', { id: editingMenu.id, oldData, newData: values });
      } else {
        // 新增菜单
        const response = await axios.post('http://localhost:5001/api/menus', values);
        message.success('菜单添加成功');
        // 记录操作历史
        addHistory('add', { id: response.data.id, ...values });
      }
      setIsModalVisible(false);
      clearIconUpload();
      fetchMenus();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 构建树形选择器数据
  const buildTreeData = (menuList) => {
    // 确保 menuList 是一个数组
    if (!Array.isArray(menuList)) {
      return [];
    }
    return menuList.map(menu => {
      const node = {
        title: menu.name,
        value: menu.id,
        key: menu.id,
      };
      // 确保 menu.children 存在且是一个数组，并且长度大于 0
      if (menu.children && Array.isArray(menu.children) && menu.children.length > 0) {
        node.children = buildTreeData(menu.children);
      }
      return node;
    });
  };

  const treeData = buildTreeData(menus);

  // 递归获取所有菜单的key，用于设置treeExpandedKeys
  const getAllMenuKeys = (menuList) => {
    let keys = [];
    if (!Array.isArray(menuList)) {
      return keys;
    }
    menuList.forEach(menu => {
      keys.push(menu.key);
      if (menu.children && Array.isArray(menu.children) && menu.children.length > 0) {
        keys = keys.concat(getAllMenuKeys(menu.children));
      }
    });
    return keys;
  };

  const allMenuKeys = getAllMenuKeys(treeData);

  // 构建表格数据
  const buildTableData = (menuList, parentName = '') => {
    let data = [];
    menuList.forEach(menu => {
      data.push({
        key: menu.id,
        name: menu.name,
        path: menu.path,
        icon: menu.icon,
        parent: parentName || '无',
        order: menu.order,
        visible: menu.visible ? '是' : '否',
      });
      if (menu.children && menu.children.length > 0) {
        data = data.concat(buildTableData(menu.children, menu.name));
      }
    });
    return data;
  };

  const columns = [
    {
      title: '菜单名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '路由路径',
      dataIndex: 'path',
      key: 'path',
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      render: (icon) => {
        if (!icon) {
          return '-';
        }
        if (icon.startsWith('data:image') || icon.startsWith('http')) {
          return (
            <Image
              width={24}
              height={24}
              src={icon}
              alt="菜单图标"
              style={{ borderRadius: 4 }}
            />
          );
        }
        return icon;
      },
    },
    {
      title: '父菜单',
      dataIndex: 'parent',
      key: 'parent',
    },
    {
      title: '显示顺序',
      dataIndex: 'order',
      key: 'order',
    },
    {
      title: '是否可见',
      dataIndex: 'visible',
      key: 'visible',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditMenu(findMenuById(menus, record.key))} 
            style={{ marginRight: 8 }}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeleteMenu(record.key)} 
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>菜单管理</h2>
        <Space>
          <Button 
            icon={<UndoOutlined />} 
            onClick={handleUndo} 
            disabled={history.length === 0} 
            loading={loading}
          >
            撤销上一步
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMenu} loading={loading}>
            新增菜单
          </Button>
        </Space>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={buildTableData(menus)} 
        pagination={{ pageSize: 10 }} 
      />

      <Modal
        title={editingMenu ? '编辑菜单' : '新增菜单'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="菜单名称"
            rules={[
              { required: true, message: '请输入菜单名称' },
              { min: 2, max: 50, message: '菜单名称长度应在2-50个字符之间' }
            ]}
          >
            <Input placeholder="请输入菜单名称" />
          </Form.Item>

          <Form.Item
            name="path"
            label="路由路径"
            rules={[
              { required: true, message: '请输入路由路径' },
              { pattern: /^\/[\w\-\/]*$/, message: '路由路径应以/开头，只允许字母、数字、-和/' }
            ]}
          >
            <Input placeholder="请输入路由路径" />
          </Form.Item>

          <Form.Item
            name="icon"
            label="图标"
          >
            <div>
              {/* 图标预览 */}
              {iconUrl && (
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
                  <Image
                    width={48}
                    height={48}
                    src={iconUrl}
                    alt="图标预览"
                    style={{ marginRight: 12 }}
                  />
                  <Button
                    type="text"
                    danger
                    onClick={() => {
                      clearIconUpload();
                      form.setFieldsValue({ icon: '' });
                    }}
                  >
                    移除图标
                  </Button>
                </div>
              )}
              {/* 图标上传 */}
              <Upload
                name="icon"
                accept="image/*"
                beforeUpload={handleBeforeUpload}
                onChange={handleUpload}
                showUploadList={false}
                maxCount={1}
              >
                <Button type="primary">
                  上传图标
                </Button>
              </Upload>
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                支持JPG、PNG、GIF格式，大小不超过2MB
              </div>
              {/* 备用：手动输入图标名称 */}
              <div style={{ marginTop: 12 }}>
                <Input placeholder="或输入图标名称（用于系统内置图标）" />
              </div>
            </div>
          </Form.Item>

          <Form.Item
            name="parent_id"
            label="父菜单"
          >
            <TreeSelect
              placeholder="请选择父菜单"
              treeData={treeData}
              allowClear
              treeDefaultExpandAll
              treeExpandedKeys={allMenuKeys}
              showSearch
              filterTreeNode={(inputValue, treeNode) =>
                treeNode.title.toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            name="order"
            label="显示顺序"
            initialValue={0}
          >
            <InputNumber min={0} placeholder="请输入显示顺序" />
          </Form.Item>

          <Form.Item
            name="visible"
            label="是否可见"
            initialValue={true}
          >
            <Select>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              style={{ marginRight: 8 }}
            >
              <SaveOutlined /> 保存
            </Button>
            <Button onClick={() => setIsModalVisible(false)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuManagement;
