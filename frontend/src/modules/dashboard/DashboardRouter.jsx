import React, { useState, useEffect } from 'react';
import StudentDashboardView from './views/StudentDashboardView';
import StudentMyComplaintsView from './views/StudentMyComplaintsView';
import ClassInchargeDashboardView from './views/ClassInchargeDashboardView';
import ClassInchargeAssignedView from './views/ClassInchargeAssignedView';
import ClassInchargeForwardedView from './views/ClassInchargeForwardedView';
import ClassInchargeOverviewView from './views/ClassInchargeOverviewView';
import TeacherGuardianDashboardView from './views/TeacherGuardianDashboardView';
import TeacherGuardianForwardedView from './views/TeacherGuardianForwardedView';
import TeacherGuardianEscalatedView from './views/TeacherGuardianEscalatedView';
import HodDashboardView from './views/HodDashboardView';
import HodComplaintsView from './views/HodComplaintsView';
import HodEscalatedView from './views/HodEscalatedView';
import HodFacultyView from './views/HodFacultyView';
import DeanDashboardView from './views/DeanDashboardView';
import PrincipalDashboardView from './views/PrincipalDashboardView';
import CampusServicesDashboardView from './views/CampusServicesDashboardView';
import ComplaintDetailsModal from '../complaints/ComplaintDetailsModal';
import RegisterComplaintModal from '../complaints/RegisterComplaintModal';
import CampusMapView from '../map/CampusMapView';
import CampusInfoView from '../map/CampusInfoView';
import NotificationsView from '../notifications/NotificationsView';
import HelpSupportView from '../help/HelpSupportView';
import ProfilePreferencesView from '../profile/ProfilePreferencesView';

import apiClient from '../../core/api/apiClient';

export default function DashboardRouter({ 
  user, 
  activeNav = 'DASHBOARD',
  onNavChange,
  openComplaintModal, 
  onComplaintModalOpened 
}) {
  const [stats, setStats] = useState({ total: 0, inProgress: 0, resolved: 0, escalated: 0 });
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedBuildingForRegister, setSelectedBuildingForRegister] = useState(null);

  const role = user?.primaryRole || (user?.roles && user?.roles[0]) || 'STUDENT';

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    if (openComplaintModal) {
      setShowRegisterModal(true);
    }
  }, [openComplaintModal]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsJson = await apiClient.get('/complaints/stats/summary');
      if (statsJson && statsJson.data) {
        setStats(statsJson.data.stats || { total: 0, inProgress: 0, resolved: 0, escalated: 0 });
      }

      const listJson = await apiClient.get('/complaints?limit=50');
      if (listJson && listJson.data) {
        setComplaints(listJson.data || []);
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentView = () => {
    // ── 1. General & Support Views ──
    if (activeNav === 'CAMPUS_INFO') {
      return (
        <CampusInfoView
          onOpenRegisterForBuilding={(b) => {
            setSelectedBuildingForRegister(b);
            setShowRegisterModal(true);
          }}
        />
      );
    }

    if (activeNav === 'CAMPUS_MAP') {
      // Analytical Campus Map is restricted to leadership
      const canAccessAnalyticalMap = ['PRINCIPAL', 'SUPER_ADMIN', 'ADMIN'].includes(role);
      if (!canAccessAnalyticalMap) {
        return (
          <CampusInfoView
            onOpenRegisterForBuilding={(b) => {
              setSelectedBuildingForRegister(b);
              setShowRegisterModal(true);
            }}
          />
        );
      }
      return (
        <CampusMapView 
          onRegisterForBuilding={(b) => {
            setSelectedBuildingForRegister(b);
            setShowRegisterModal(true);
          }} 
        />
      );
    }

    if (activeNav === 'NOTIFICATIONS') {
      return (
        <NotificationsView 
          onSelectComplaint={(c) => setSelectedComplaint(c)} 
        />
      );
    }

    if (activeNav === 'HELP_SUPPORT') {
      return (
        <HelpSupportView 
          onOpenRegister={() => setShowRegisterModal(true)} 
        />
      );
    }

    if (activeNav === 'PROFILE_PREFERENCES') {
      return (
        <ProfilePreferencesView 
          user={user} 
        />
      );
    }

    // ── 2. Role-Adaptive Views ──
    const commonProps = {
      user,
      stats,
      complaints,
      loading,
      activeNav,
      onOpenRegister: () => setShowRegisterModal(true),
      onSelectComplaint: (c) => setSelectedComplaint(c),
      onRefresh: fetchDashboardData
    };

    switch (role) {
      case 'STUDENT':
        if (activeNav === 'MY_COMPLAINTS') {
          return <StudentMyComplaintsView {...commonProps} />;
        }
        return (
          <StudentDashboardView 
            {...commonProps} 
            onNavigateToMyComplaints={() => onNavChange && onNavChange('MY_COMPLAINTS')}
          />
        );

      case 'CLASS_INCHARGE':
      case 'FACULTY':
        if (activeNav === 'ASSIGNED_COMPLAINTS' || activeNav === 'DEPT_TASKS' || activeNav === 'PENDING_ACTIONS') {
          return <ClassInchargeAssignedView {...commonProps} />;
        }
        if (activeNav === 'FORWARDED_COMPLAINTS' || activeNav === 'RESOLUTION_UPDATES') {
          return <ClassInchargeForwardedView {...commonProps} />;
        }
        if (activeNav === 'CLASS_OVERVIEW' || activeNav === 'CLASS_COMPLAINTS') {
          return <ClassInchargeOverviewView {...commonProps} />;
        }
        if (activeNav === 'MY_COMPLAINTS') {
          return <ClassInchargeAssignedView {...commonProps} />;
        }
        return <ClassInchargeDashboardView {...commonProps} />;

      case 'TEACHER_GUARDIAN':
        if (activeNav === 'FORWARDED_COMPLAINTS' || activeNav === 'STUDENT_CONCERNS') {
          return <TeacherGuardianForwardedView user={user} onSelectComplaint={(c) => setSelectedComplaint(c)} />;
        }
        if (activeNav === 'ESCALATED_COMPLAINTS' || activeNav === 'PENDING_RESPONSES' || activeNav === 'RESOLUTION_FOLLOWUP') {
          return <TeacherGuardianEscalatedView user={user} onSelectComplaint={(c) => setSelectedComplaint(c)} />;
        }
        if (activeNav === 'MY_COMPLAINTS') {
          return <TeacherGuardianForwardedView user={user} onSelectComplaint={(c) => setSelectedComplaint(c)} />;
        }
        return <TeacherGuardianDashboardView {...commonProps} />;

      case 'HOD':
        if (activeNav === 'DEPARTMENT_COMPLAINTS' || activeNav === 'PENDING_ASSIGNMENT') {
          return <HodComplaintsView user={user} onSelectComplaint={(c) => setSelectedComplaint(c)} />;
        }
        if (activeNav === 'ESCALATED_COMPLAINTS' || activeNav === 'RESOLUTION_MONITORING') {
          return <HodEscalatedView user={user} onSelectComplaint={(c) => setSelectedComplaint(c)} />;
        }
        if (activeNav === 'FACULTY_STAFF' || activeNav === 'DEPARTMENT_OVERVIEW') {
          return <HodFacultyView user={user} />;
        }
        if (activeNav === 'MY_COMPLAINTS') {
          return <HodComplaintsView user={user} onSelectComplaint={(c) => setSelectedComplaint(c)} />;
        }
        return <HodDashboardView {...commonProps} />;

      case 'DEAN':
        if (activeNav === 'MY_REQUESTS') {
          return <StudentMyComplaintsView {...commonProps} />;
        }
        return <DeanDashboardView {...commonProps} />;

      case 'PRINCIPAL':
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return <PrincipalDashboardView {...commonProps} />;

      case 'CAMPUS_SERVICES_HEAD':
      case 'MAINTENANCE':
      case 'FACILITIES_STAFF':
        if (activeNav === 'ASSIGNED_BUILDINGS' || activeNav === 'FACILITY_INFO') {
          return (
            <CampusInfoView
              onOpenRegisterForBuilding={(b) => {
                setSelectedBuildingForRegister(b);
                setShowRegisterModal(true);
              }}
            />
          );
        }
        return <CampusServicesDashboardView {...commonProps} />;

      default:
        return user?.profileType === 'STUDENT'
          ? (
            activeNav === 'MY_COMPLAINTS'
              ? <StudentMyComplaintsView {...commonProps} />
              : <StudentDashboardView {...commonProps} onNavigateToMyComplaints={() => onNavChange && onNavChange('MY_COMPLAINTS')} />
          )
          : <ClassInchargeDashboardView {...commonProps} />;
    }
  };

  return (
    <>
      {renderCurrentView()}

      {showRegisterModal && (
        <RegisterComplaintModal
          defaultBuilding={selectedBuildingForRegister}
          onClose={() => {
            setShowRegisterModal(false);
            setSelectedBuildingForRegister(null);
            if (onComplaintModalOpened) onComplaintModalOpened();
          }}
          onSuccess={() => {
            fetchDashboardData();
          }}
          onViewComplaint={(created) => {
            setSelectedComplaint(created);
          }}
        />
      )}

      {selectedComplaint && (
        <ComplaintDetailsModal
          complaint={selectedComplaint}
          role={role}
          user={user}
          onClose={() => setSelectedComplaint(null)}
          onRefresh={fetchDashboardData}
        />
      )}
    </>
  );
}
