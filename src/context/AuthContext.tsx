import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  PermissionKey, 
  PermissionsMap, 
  Employee, 
  DEFAULT_ADMIN_PERMISSIONS, 
  DEFAULT_EMPLOYEE_PERMISSIONS, 
  DEFAULT_MANAGER_PERMISSIONS 
} from '../types';
import { Storage } from '../lib/storage';

export type UserRole = 'admin' | 'employee';

export interface AuthUser {
  uid: string;
  id?: string;
  email: string | null;
  displayName: string | null;
  name?: string;
  photoURL?: string | null;
}

export type User = AuthUser;

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  employeeId?: string;
  photoURL?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isEmployee: boolean;
  loading: boolean;
  authError: string | null;
  userEmployeeRecord: Employee | null;
  currentPermissions: PermissionsMap;
  canOverrideContextSelect: boolean;
  hasPermission: (key: PermissionKey) => boolean;
  canApproveRecord: (recordEmployeeId: string | undefined, approvalPermissionKey: PermissionKey) => boolean;
  refreshCurrentUser: () => Promise<void>;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string, desiredRole?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'signup';
  openAuthModal: (tab?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  switchRoleDemo: (newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BOOTSTRAPPED_ADMIN_EMAILS = [
  'betzitian@gmail.com',
  'admin@paiequebec.com',
  'rh@paiequebec.com'
];

const STORAGE_USER_KEY = 'paieqc_auth_user';
const STORAGE_PROFILE_KEY = 'paieqc_user_profile';
const STORAGE_ROLE_OVERRIDE_KEY = 'paieqc_role_override';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [roleOverride, setRoleOverride] = useState<UserRole | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ROLE_OVERRIDE_KEY);
      return (saved as UserRole) || null;
    } catch {
      return null;
    }
  });

  const [userEmployeeRecord, setUserEmployeeRecord] = useState<Employee | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');

  const clearAuthError = () => setAuthError(null);

  // Sync state changes with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(userProfile));
    } else {
      localStorage.removeItem(STORAGE_PROFILE_KEY);
    }
  }, [userProfile]);

  useEffect(() => {
    if (roleOverride) {
      localStorage.setItem(STORAGE_ROLE_OVERRIDE_KEY, roleOverride);
    } else {
      localStorage.removeItem(STORAGE_ROLE_OVERRIDE_KEY);
    }
  }, [roleOverride]);

  // Load employee record matching current logged in user
  useEffect(() => {
    const loadMatchedEmployee = async () => {
      try {
        const emps = await Storage.getEmployees();
        if (Array.isArray(emps) && emps.length > 0) {
          const currentEmail = user?.email?.toLowerCase();
          const currentId = user?.id || user?.uid || userProfile?.employeeId;
          const matched = emps.find(e => 
            (currentEmail && e.email?.toLowerCase() === currentEmail) || 
            (currentId && e.id === currentId)
          );
          if (matched) {
            setUserEmployeeRecord(matched);
          } else {
            setUserEmployeeRecord(emps[0]); // fallback to first demo employee
          }
        }
      } catch (err) {
        console.error("Error loading matched employee for permissions:", err);
      }
    };
    loadMatchedEmployee();
  }, [user, userProfile]);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const defaultEmail = 'betzitian@gmail.com';
      const isBootstrappedAdmin = BOOTSTRAPPED_ADMIN_EMAILS.includes(defaultEmail.toLowerCase());
      const googleUser: User = {
        uid: 'usr_google_default',
        id: 'usr_google_default',
        email: defaultEmail,
        displayName: 'Betzitian Admin',
        name: 'Betzitian Admin',
        photoURL: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
      };

      const profile: UserProfile = {
        uid: googleUser.uid,
        email: defaultEmail,
        displayName: 'Betzitian Admin',
        role: isBootstrappedAdmin ? 'admin' : 'employee',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setUser(googleUser);
      setUserProfile(profile);
      setIsAuthModalOpen(false);
    } catch (err: unknown) {
      console.error('Google Sign In Error:', err);
      const message = err instanceof Error ? err.message : 'Échec de connexion Google.';
      setAuthError(message);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        throw new Error('Veuillez entrer une adresse courriel valide.');
      }
      if (!pass || pass.length < 4) {
        throw new Error('Le mot de passe doit comporter au moins 4 caractères.');
      }

      const isBootstrappedAdmin = BOOTSTRAPPED_ADMIN_EMAILS.includes(cleanEmail);
      const namePart = cleanEmail.split('@')[0];
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

      const authedUser: User = {
        uid: `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        id: `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: cleanEmail,
        displayName: formattedName,
        name: formattedName
      };

      const profile: UserProfile = {
        uid: authedUser.uid,
        email: cleanEmail,
        displayName: formattedName,
        role: isBootstrappedAdmin ? 'admin' : 'employee',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setUser(authedUser);
      setUserProfile(profile);
      setIsAuthModalOpen(false);
    } catch (err: unknown) {
      console.error('Email Sign In Error:', err);
      const friendlyMsg = err instanceof Error ? err.message : 'Échec de connexion.';
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string, desiredRole: UserRole = 'employee') => {
    setAuthError(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        throw new Error('Veuillez renseigner une adresse courriel.');
      }
      if (!pass || pass.length < 4) {
        throw new Error('Le mot de passe doit comporter au moins 4 caractères.');
      }

      const isBootstrappedAdmin = BOOTSTRAPPED_ADMIN_EMAILS.includes(cleanEmail);
      const finalRole: UserRole = isBootstrappedAdmin ? 'admin' : desiredRole;
      const finalDisplayName = displayName?.trim() || cleanEmail.split('@')[0];

      const authedUser: User = {
        uid: `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        id: `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: cleanEmail,
        displayName: finalDisplayName,
        name: finalDisplayName
      };

      const profile: UserProfile = {
        uid: authedUser.uid,
        email: cleanEmail,
        displayName: finalDisplayName,
        role: finalRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setUser(authedUser);
      setUserProfile(profile);
      setIsAuthModalOpen(false);
    } catch (err: unknown) {
      console.error('Sign Up Error:', err);
      const friendlyMsg = err instanceof Error ? err.message : 'Échec de la création du compte.';
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setUserProfile(null);
      setUserEmployeeRecord(null);
      setRoleOverride(null);
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_PROFILE_KEY);
      localStorage.removeItem(STORAGE_ROLE_OVERRIDE_KEY);
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
  };

  const openAuthModal = (tab: 'login' | 'signup' = 'login') => {
    setAuthModalTab(tab);
    setAuthError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthError(null);
  };

  const switchRoleDemo = (newRole: UserRole) => {
    setRoleOverride(newRole);
  };

  // Determine current effective role
  const effectiveRole: UserRole = useMemo(() => {
    if (roleOverride) return roleOverride;
    if (userProfile?.role) return userProfile.role;
    if (user?.email && BOOTSTRAPPED_ADMIN_EMAILS.includes(user.email.toLowerCase())) return 'admin';
    return 'admin'; // Default for preview mode to allow complete exploration
  }, [roleOverride, userProfile, user]);

  const isAdmin = effectiveRole === 'admin';
  const isEmployee = effectiveRole === 'employee';

  // Compute current permissions map dynamically
  const currentPermissions: PermissionsMap = useMemo(() => {
    // If the employee record has explicitly configured permissions, use them
    if (userEmployeeRecord?.permissions && Object.keys(userEmployeeRecord.permissions).length > 0) {
      return {
        ...(isAdmin ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_EMPLOYEE_PERMISSIONS),
        ...userEmployeeRecord.permissions
      };
    }
    // Otherwise fallback based on effective role
    if (isAdmin) {
      return DEFAULT_ADMIN_PERMISSIONS;
    }
    return DEFAULT_EMPLOYEE_PERMISSIONS;
  }, [userEmployeeRecord, isAdmin]);

  const hasPermission = (key: PermissionKey): boolean => {
    if (currentPermissions[key] !== undefined) {
      return currentPermissions[key];
    }
    // If admin and key is not specified, default to true
    if (isAdmin) return true;
    return false;
  };

  // Context Locking Switcher Flag
  const canOverrideContextSelect = useMemo(() => {
    return hasPermission('EMP_OVERRIDE_CONTEXT_SELECT');
  }, [currentPermissions, isAdmin]);

  // Anti-Self-Approval Safeguard
  const canApproveRecord = (recordEmployeeId: string | undefined, approvalPermissionKey: PermissionKey): boolean => {
    if (!hasPermission(approvalPermissionKey)) return false;
    
    // Anti-self-approval rule: users cannot approve their own records even if they have approval rights
    const currentUserId = userEmployeeRecord?.id || user?.id || userProfile?.employeeId || user?.uid;
    if (recordEmployeeId && currentUserId && recordEmployeeId === currentUserId) {
      return false; // Blocked by Anti-Self-Approval Safeguard
    }
    return true;
  };

  const refreshCurrentUser = async () => {
    if (user?.email) {
      try {
        const emps = await Storage.getEmployees();
        const match = emps.find(e => e.email.toLowerCase() === user.email?.toLowerCase());
        if (match) {
          setUserEmployeeRecord(match);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        role: effectiveRole,
        isAdmin,
        isEmployee,
        loading,
        authError,
        userEmployeeRecord,
        currentPermissions,
        canOverrideContextSelect,
        hasPermission,
        canApproveRecord,
        refreshCurrentUser,
        clearAuthError,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        switchRoleDemo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
