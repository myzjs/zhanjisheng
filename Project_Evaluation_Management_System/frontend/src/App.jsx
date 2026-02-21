import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import Login from './pages/Login';
import Layout from './components/Layout';
import { useAuth } from './utils/auth.jsx';

// 直接导入组件，不使用懒加载
import TodoNotification from './pages/todo/Notification';
import TodoImplementation from './pages/todo/Implementation';
import TodoLearning from './pages/todo/Learning';
import ProjectList from './pages/project/List';
import ProjectResearch from './pages/project/Research';
import ProjectResearchForm from './pages/project/ResearchForm';
import ProjectModalTest from './pages/project/ModalTest';
import ProjectImplementation from './pages/project/Implementation';
import ProjectTraining from './pages/project/Training';
import VendorResearchForm from './pages/project/VendorResearchForm';
import VendorResearchEditForm from './pages/project/VendorResearchEditForm';
import TrainingCourseware from './pages/training/Courseware';
import TrainingLearning from './pages/training/Learning';
import TrainingCatalog from './pages/training/Catalog';
import SystemUser from './pages/system/User';
import SystemRole from './pages/system/Role';
import SystemSkin from './pages/system/Skin';
import SystemDict from './pages/system/Dict';
import SystemMenu from './pages/system/Menu';
import SystemEvaluationStandard from './pages/system/EvaluationStandard';
import SystemEMRStandardClause from './pages/system/EMRStandardClause';
import SystemEvaluationType from './pages/system/EvaluationType';
import SystemEvaluationLevel from './pages/system/EvaluationLevel';
import SystemStandardCatalog from './pages/system/StandardCatalog';
import SystemResearchTemplate from './pages/system/ResearchTemplate';
import SystemDictionary from './pages/system/SystemDictionary';
import SystemEvaluationProject from './pages/system/EvaluationProject';
import TestQuestionnaire from './pages/system/TestQuestionnaire';
import TestPage from './pages/system/TestPage';

// PrivateRoute组件
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    // 认证状态检查中，显示加载状态
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}><Spin size="large" /></div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          {/* 我的待办 */}
          <Route path="todo/notification" element={<TodoNotification />} />
          <Route path="todo/implementation" element={<TodoImplementation />} />
          <Route path="todo/learning" element={<TodoLearning />} />
          {/* 项目管理 */}
          <Route path="project/list" element={<ProjectList />} />
          <Route path="project/research" element={<ProjectResearch />} />
          <Route path="project/research-form" element={<ProjectResearchForm />} />
          <Route path="project/modal-test" element={<ProjectModalTest />} />
          <Route path="project/implementation" element={<ProjectImplementation />} />
          <Route path="project/training" element={<ProjectTraining />} />
          <Route path="project/vendor-research-form" element={<VendorResearchForm />} />
          <Route path="project/vendor-research-edit" element={<VendorResearchEditForm />} />
          {/* 项目培训 */}
          <Route path="training/courseware" element={<TrainingCourseware />} />
          <Route path="training/learning" element={<TrainingLearning />} />
          <Route path="training/catalog" element={<TrainingCatalog />} />
          {/* 系统设置 */}
          <Route path="system/user" element={<SystemUser />} />
          <Route path="system/role" element={<SystemRole />} />
          <Route path="system/skin" element={<SystemSkin />} />
          <Route path="system/dict" element={<SystemDict />} />
          <Route path="system/menu" element={<SystemMenu />} />
          <Route path="system/evaluation-standard" element={<SystemEvaluationStandard />} />
          <Route path="system/emr-standard-clause" element={<SystemEMRStandardClause />} />
          <Route path="system/evaluation-type" element={<SystemEvaluationType />} />
          <Route path="system/evaluation-level" element={<SystemEvaluationLevel />} />
          <Route path="system/standard-catalog" element={<SystemStandardCatalog />} />
          <Route path="system/research-template" element={<SystemResearchTemplate />} />
          <Route path="system/system-dictionary" element={<SystemDictionary />} />
          <Route path="system/evaluation-project" element={<SystemEvaluationProject />} />
          <Route path="system/test-questionnaire" element={<TestQuestionnaire />} />
          <Route path="system/test" element={<TestPage />} />
          <Route index element={<Navigate to="todo/notification" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
