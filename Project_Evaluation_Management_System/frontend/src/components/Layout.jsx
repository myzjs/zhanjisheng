import { useState, useEffect, useMemo } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, message } from 'antd';
import { 
  LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined,
  BellOutlined, SearchOutlined, SettingOutlined, BookOutlined,
  ProjectOutlined, ScheduleOutlined, VideoCameraOutlined,
  SkinOutlined, OrderedListOutlined, MenuOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/auth.jsx';
import axios from 'axios';

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [menus, setMenus] = useState([]);
  const [primaryColor, setPrimaryColor] = useState('#1890ff'); // 默认主题色
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 获取当前皮肤配置
  const getSkinConfig = () => {
    // 从localStorage获取保存的皮肤配置
    const savedConfig = localStorage.getItem('skinConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setPrimaryColor(config.primaryColor || '#1890ff');
      // 应用皮肤配置
      applySkinConfig(config);
    } else {
      // 使用默认配置
      const defaultConfig = {
        primaryColor: '#1890ff',
        headerColor: '#1890ff',
        sidebarColor: '#fff',
        sidebarTextColor: '#333',
        contentBgColor: '#f0f2f5',
        textColor: '#333',
        buttonColor: '#1890ff',
        fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif'
      };
      setPrimaryColor(defaultConfig.primaryColor);
      applySkinConfig(defaultConfig);
    }
  };

  // 强制应用皮肤配置到所有元素
  const forceApplySkinConfig = (config) => {
    try {
      // 设置CSS变量
      document.documentElement.style.setProperty('--primary-color', config.primaryColor);
      document.documentElement.style.setProperty('--header-color', config.headerColor);
      document.documentElement.style.setProperty('--sidebar-color', config.sidebarColor);
      document.documentElement.style.setProperty('--sidebar-text-color', config.sidebarTextColor);
      document.documentElement.style.setProperty('--content-bg-color', config.contentBgColor);
      document.documentElement.style.setProperty('--text-color', config.textColor);
      document.documentElement.style.setProperty('--button-color', config.buttonColor);
      document.documentElement.style.setProperty('--font-family', config.fontFamily);
      
      // 直接更新所有相关元素的样式
      document.body.style.fontFamily = config.fontFamily;
      document.body.style.color = config.textColor;
      
      // 强制更新侧边栏样式
      const siderElement = document.querySelector('.ant-layout-sider');
      if (siderElement) {
        siderElement.style.backgroundColor = config.sidebarColor;
      }
      
      // 强制更新菜单样式
      const menuElements = document.querySelectorAll('.ant-menu');
      menuElements.forEach(menu => {
        menu.style.color = config.sidebarTextColor;
      });
      
      // 强制更新菜单项样式
      const menuItemElements = document.querySelectorAll('.ant-menu-item');
      menuItemElements.forEach(item => {
        item.style.color = config.sidebarTextColor;
      });
      
      // 强制更新内容区域样式
      const contentElement = document.querySelector('.ant-layout-content');
      if (contentElement) {
        contentElement.style.backgroundColor = config.contentBgColor;
      }
    } catch (error) {
      console.error('强制应用皮肤配置出错:', error);
    }
  };

  // 应用皮肤配置
  const applySkinConfig = (config) => {
    document.documentElement.style.setProperty('--primary-color', config.primaryColor);
    document.documentElement.style.setProperty('--header-color', config.headerColor);
    document.documentElement.style.setProperty('--sidebar-color', config.sidebarColor);
    document.documentElement.style.setProperty('--sidebar-text-color', config.sidebarTextColor);
    document.documentElement.style.setProperty('--content-bg-color', config.contentBgColor);
    document.documentElement.style.setProperty('--text-color', config.textColor);
    document.documentElement.style.setProperty('--button-color', config.buttonColor);
    document.documentElement.style.setProperty('--font-family', config.fontFamily);
    // 更新文档字体
    document.body.style.fontFamily = config.fontFamily;
    
    // 强制应用样式到所有元素
    setTimeout(() => {
      forceApplySkinConfig(config);
    }, 100);
  };

  // 监听皮肤配置变化
  useEffect(() => {
    getSkinConfig();
    // 监听localStorage变化
    const handleStorageChange = (e) => {
      if (e.key === 'skinConfig') {
        const config = JSON.parse(e.newValue);
        setPrimaryColor(config.primaryColor || '#1890ff');
        applySkinConfig(config);
      } else if (e.key === 'primaryColor') {
        setPrimaryColor(e.newValue);
        document.documentElement.style.setProperty('--primary-color', e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 组件挂载后强制应用皮肤配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('skinConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setTimeout(() => {
        forceApplySkinConfig(config);
      }, 300);
    }
  }, []);

  // 获取菜单数据
  const fetchMenus = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/menus');
      setMenus(response.data || []);
    } catch (error) {
      console.error('获取菜单失败:', error);
      // 使用模拟菜单数据
      setMenus([
        {
          id: 1,
          name: '我的待办',
          path: 'todo/notification',
          icon: 'notification',
          children: [
            { id: 2, name: '任务通知', path: 'todo/notification', icon: 'notification' },
            { id: 3, name: '实施待办', path: 'todo/implementation', icon: 'implementation' },
            { id: 4, name: '学习待办', path: 'todo/learning', icon: 'learning' }
          ]
        },
        {
            id: 5,
            name: '项目管理',
            path: 'project/list',
            icon: 'project',
            children: [
              { id: 6, name: '项目列表', path: 'project/list', icon: 'list' },
              { id: 7, name: '调研任务', path: 'project/research', icon: 'research' },
              { id: 8, name: '厂商调研', path: 'project/vendor-research-form', icon: 'research' },
              { id: 9, name: '项目培训', path: 'project/training', icon: 'training' }
            ]
          },
        {
          id: 9,
          name: '项目培训',
          path: 'training/courseware',
          icon: 'training',
          children: [
            { id: 10, name: '课件管理', path: 'training/courseware', icon: 'courseware' },
            { id: 11, name: '学习记录', path: 'training/learning', icon: 'learning' },
            { id: 12, name: '课程目录', path: 'training/catalog', icon: 'list' }
          ]
        },
        {
          id: 13,
          name: '系统设置',
          path: 'system/user',
          icon: 'system',
          children: [
            { id: 14, name: '用户管理', path: 'system/user', icon: 'user' },
            { id: 15, name: '角色管理', path: 'system/role', icon: 'role' },
            { id: 16, name: '皮肤管理', path: 'system/skin', icon: 'skin' },
            { id: 17, name: '字典管理', path: 'system/dict', icon: 'dict' },
            { id: 18, name: '菜单管理', path: 'system/menu', icon: 'menu' }
          ]
        }
      ]);
    }
  };

  // 初始化时获取菜单
  useEffect(() => {
    fetchMenus();
  }, []);

  const toggle = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 图标名称映射表
  const iconMap = {
    // 系统图标
    'todo': <ScheduleOutlined />,
    'notification': <BellOutlined />,
    'research': <SearchOutlined />,
    'implementation': <SettingOutlined />,
    'learning': <BookOutlined />,
    'project': <ProjectOutlined />,
    'list': <OrderedListOutlined />,
    'training': <VideoCameraOutlined />,
    'courseware': <BookOutlined />,
    'system': <SettingOutlined />,
    'user': <UserOutlined />,
    'role': <UserOutlined />,
    'skin': <SkinOutlined />,
    'dict': <OrderedListOutlined />,
    'menu': <MenuOutlined />,
    'standard': <OrderedListOutlined />
  };

  // 渲染菜单图标
  const renderMenuIcon = (icon) => {
    if (!icon) return null;
    
    // 如果是base64编码的图片
    if (icon.startsWith('data:image')) {
      return (
        <img 
          src={icon} 
          alt="menu icon" 
          style={{ width: 16, height: 16, objectFit: 'contain' }} 
        />
      );
    }
    
    // 如果是http链接的图片
    if (icon.startsWith('http')) {
      return (
        <img 
          src={icon} 
          alt="menu icon" 
          style={{ width: 16, height: 16, objectFit: 'contain' }} 
        />
      );
    }
    
    // 如果是图标名称
    if (iconMap[icon]) {
      return iconMap[icon];
    }
    
    // 默认返回空
    return null;
  };

  // 递归生成菜单项，支持多级菜单
  const generateMenuItems = (menuList) => {
    return menuList.map(menu => {
      if (menu.children && Array.isArray(menu.children) && menu.children.length > 0) {
        return {
          key: menu.path,
          label: menu.name,
          icon: renderMenuIcon(menu.icon),
          children: generateMenuItems(menu.children),
        };
      }
      return {
        key: menu.path,
        label: menu.name,
        icon: renderMenuIcon(menu.icon),
      };
    });
  };

  const menuItems = generateMenuItems(menus);

  // 确保下拉菜单的定义不会导致渲染问题
  const dropdownMenu = useMemo(() => (
    <Menu>
      <Menu.Item key="profile">
        <UserOutlined /> 个人中心
      </Menu.Item>
      <Menu.Item key="logout" onClick={handleLogout}>
        <LogoutOutlined /> 退出登录
      </Menu.Item>
    </Menu>
  ), [handleLogout]);

  return (
    <Layout style={{ minHeight: '100vh', margin: 0, padding: 0 }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 24px', 
        background: 'var(--header-color, #1890ff)', 
        color: '#fff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', 
        flexWrap: 'wrap', 
        margin: 0 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: { xs: 8, sm: 0 } }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={toggle} style={{ marginRight: 16, color: '#fff' }} />
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>项目评审管理系统</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button type="text" style={{ color: '#fff' }} onClick={() => {
            // 清除缓存功能
            localStorage.clear();
            sessionStorage.clear();
            message.success('缓存已清除');
          }}>
            清缓存
          </Button>
          <span style={{ color: '#fff' }}>欢迎 admin</span>
        </div>
      </Header>
      <Layout style={{ margin: 0 }}>
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed} 
          style={{ 
            background: 'var(--sidebar-color, #fff)', 
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.09)', 
            margin: 0 
          }}
          breakpoint="lg"
          collapsedWidth="0"
          onBreakpoint={(broken) => setCollapsed(broken)}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ 
              height: '100%', 
              borderRight: 0,
              color: 'var(--sidebar-text-color, #333)'
            }}
            items={menuItems}
            onClick={({ key }) => {
              navigate(key);
            }}
            theme={localStorage.getItem('skinConfig') ? 'light' : 'light'}
          />
        </Sider>
        <Content style={{ 
          margin: 0, 
          padding: '24px', 
          background: 'var(--content-bg-color, #f0f2f5)', 
          minWidth: 0 
        }}>
          <div style={{ 
            background: '#fff', 
            borderRadius: '8px', 
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', 
            padding: '24px',
            color: 'var(--text-color, #333)'
          }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
