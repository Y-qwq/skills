import {
  createContext,
  useContext,
} from 'react';
import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { workspaceApi } from './workspaceApi';

interface Workspace {
  id: string;
  name: string;
}

interface WorkspaceContextValue {
  workspace: Workspace;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

interface WorkspaceProviderProps {
  workspace: Workspace;
  children: ReactNode;
}

export function WorkspaceProvider({
  workspace,
  children,
}: WorkspaceProviderProps) {
  const refresh = () => workspaceApi.refresh(workspace.id);

  return (
    <WorkspaceContext.Provider value={{ workspace, refresh }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function WorkspaceStatus() {
  const value = useContext(WorkspaceContext);

  if (!value) {
    throw new Error('WorkspaceStatus must be rendered inside WorkspaceProvider');
  }

  return <Text>{value.workspace.name}</Text>;
}
