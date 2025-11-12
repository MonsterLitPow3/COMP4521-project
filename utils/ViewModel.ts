// // utils/ViewModel.ts
// import { repository } from "./Repository";
// import { RealtimeChannel, Session } from '@supabase/supabase-js';

// // Types for our state
// interface AppState {
//     session: Session | null;
//     loading: boolean;
//     teams: any[];
//     currentTeam: any | null;
//     teamTasks: any[];
//     memberTasks: any[];
//     clockRecords: any[];
// }

// // Define what data can change
// type StateKey = keyof AppState;
// type Listener<T> = (value: T) => void;

// class ViewModel {
//     private state: AppState = {
//         session: null,
//         loading: true,
//         teams: [],
//         currentTeam: null,
//         teamTasks: [],
//         memberTasks: [],
//         clockRecords: []
//     };

//     private listeners: Map<StateKey, Set<Listener<any>>> = new Map();
//     private authSubscription: any = null;
//     private dataSubscriptions: Map<string, RealtimeChannel> = new Map();

//     constructor() {
//         this.setState('loading', true);
//         console.log('ViewModel: Initializing ViewModel');
//         // Initialize listeners for all state keys
//         (Object.keys(this.state) as StateKey[]).forEach(key => {
//             this.listeners.set(key, new Set());
//         });

//         // Setup auth state subscription
//         this.setupAuthSubscription();
//     }

//     private setupAuthSubscription() {
//         console.log('ViewModel: Setting up auth subscription');
//         if (this.authSubscription) {
//             console.log('ViewModel: Auth subscription already exists, skipping setup');
//             this.setState('loading', false);
//             return;
//         }
//         this.authSubscription = repository.subscribeToAuth(({ event, session }) => {
//             console.log('Auth event:', event, session);
//             if (event === 'SIGNED_IN') {
//                 this.setState('session', session);
//             } else if (event === 'SIGNED_OUT') {
//                 this.setState('session', null);
//             }
//         });
//         this.setState('loading', false);
//     }

//     // State management
//     setState<K extends StateKey>(key: K, value: AppState[K]) {
//         console.log(`ViewModel: Setting state ${key} to`, value);
//         this.state[key] = value;
//         this.notifyListeners(key, value);
//     }

//     // not tested yet, but works as I tried
//     private notifyListeners<K extends StateKey>(key: K, value: AppState[K]) {
//         const keyListeners = this.listeners.get(key);
//         if (keyListeners) {
//             keyListeners.forEach(listener => listener(value));
//         }
//     }

//     // Public subscription API
//     // not tested yet, but works as I tried
//     subscribe<K extends StateKey>(key: K, listener: Listener<AppState[K]>) {
//         console.log(`ViewModel: State ${key} being subscribed`);
//         const keyListeners = this.listeners.get(key);
//         if (keyListeners) {
//             keyListeners.add(listener);
//             // Immediately call listener with current value
//             listener(this.state[key]);
//         }

//         // Return unsubscribe function
//         return () => {
//             const set = this.listeners.get(key);
//             if (set) {
//                 set.delete(listener);
//             }
//         };
//     }

//     // Getters
//     getState<K extends StateKey>(key: K): AppState[K] {
//         return this.state[key];
//     }

//     isAuthenticated(): boolean {
//         return this.state.session !== null;
//     }

//     // will add value checking later
//     async signUpWithEmail(email: string, password: string) {
//         try {
//             this.setState('loading', true);
//             const { data, error } = await repository.signUpWithEmail(email, password);
//             return { data, error };
//         } finally {
//             this.setState('loading', false);
//         }
//     }

//     async signInWithEmail(email: string, password: string) {
//         try {
//             this.setState('loading', true);
//             const { data, error } = await repository.signInWithEmail(email, password);
//             return { data, error };
//         } finally {
//             this.setState('loading', false);
//         }
//     }

//     async signOut() {
//         try {
//             this.setState('loading', true);
//             const { error } = await repository.signOut();
//             if (error) {
//                 console.error('Sign-out error:', error);
//                 return { error };
//             } else {
//                 this.setState('session', null);
//                 return { error: null };
//             }
//         } finally {
//             this.setState('loading', false);
//         }
//     }

//     // Data fetching methods
//     // seems ok
//     async loadUserTeams() {
//         if (!this.state.session?.user) return;

//         try {
//             this.setState('loading', true);
//             const result = await repository.fetchUserTeams(this.state.session.user.id);
//             if (result.data) {
//                 this.setState('teams', result.data.map((item: any) => item.Teams));

//                 // Auto-select first team if none selected
//                 if (result.data.length > 0 && !this.state.currentTeam) {
//                     this.setState('currentTeam', result.data[0].Teams);
//                 }
//             }
//         } catch (error) {
//             console.error('Error loading teams:', error);
//         } finally {
//             this.setState('loading', false);
//         }
//     }

//     // not tested yet
//     async loadTeamTasks(teamId: number) {
//         try {
//             const result = await repository.fetchTeamTasks(teamId);
//             if (result.data) {
//                 this.setState('teamTasks', result.data);
//             }
//         } catch (error) {
//             console.error('Error loading team tasks:', error);
//         }
//     }

//     // not tested yet
//     async loadMemberTasks(mId: number) {
//         try {
//             const result = await repository.fetchMemberTasks(mId);
//             if (result.data) {
//                 this.setState('memberTasks', result.data.map((item: any) => ({
//                     ...item.Tasks,
//                     assignmentId: item.taskId
//                 })));
//             }
//         } catch (error) {
//             console.error('Error loading member tasks:', error);
//         }
//     }

//     // Real-time subscription management
//     // not tested yet
//     subscribeToTeamTasks(teamId: number) {
//         // Unsubscribe from previous team tasks
//         this.unsubscribeFromChannel('team-tasks');

//         const channel = repository.subscribeToTeamTasks(teamId, (payload) => {
//             console.log('Team tasks updated:', payload);

//             // Update local state based on the change
//             const currentTasks = [...this.state.teamTasks];

//             switch (payload.eventType) {
//                 case 'INSERT':
//                     currentTasks.push(payload.new);
//                     break;
//                 case 'UPDATE':
//                     const updateIndex = currentTasks.findIndex(
//                         task => task.taskId === payload.new.taskId
//                     );
//                     if (updateIndex !== -1) {
//                         currentTasks[updateIndex] = payload.new;
//                     }
//                     break;
//                 case 'DELETE':
//                     const deleteIndex = currentTasks.findIndex(
//                         task => task.taskId === payload.old.taskId
//                     );
//                     if (deleteIndex !== -1) {
//                         currentTasks.splice(deleteIndex, 1);
//                     }
//                     break;
//             }

//             this.setState('teamTasks', currentTasks);
//         });

//         this.dataSubscriptions.set('team-tasks', channel);
//     }

//     // not tested yet
//     subscribeToMemberTasks(mId: number) {
//         this.unsubscribeFromChannel('member-tasks');

//         const channel = repository.subscribeToMemberTasks(mId, (payload) => {
//             console.log('Member tasks updated:', payload);

//             const currentTasks = [...this.state.memberTasks];

//             if (payload.eventType === 'INSERT' && payload.taskDetails) {
//                 currentTasks.push({
//                     ...payload.taskDetails,
//                     assignmentId: (payload.new as any).taskId
//                 });
//             } else if (payload.eventType === 'DELETE') {
//                 const deleteIndex = currentTasks.findIndex(
//                     task => task.assignmentId === (payload.old as any).taskId
//                 );
//                 if (deleteIndex !== -1) {
//                     currentTasks.splice(deleteIndex, 1);
//                 }
//             }

//             this.setState('memberTasks', currentTasks);
//         });

//         this.dataSubscriptions.set('member-tasks', channel);
//     }

//     // not tested yet
//     private unsubscribeFromChannel(channelName: string) {
//         const channel = this.dataSubscriptions.get(channelName);
//         if (channel) {
//             channel.unsubscribe();
//             this.dataSubscriptions.delete(channelName);
//         }
//     }

//     // Mutation methods

//     // teams table rls policy is problematic, only work if disabled its rls policy
//     async createTeam(teamName: string) {
//         try {
//             this.setState('loading', true);
//             const { data, error } = await repository.createTeam(teamName, null, null, null, null);
//             if (error) {
//                 console.error('Error adding team:', error);
//                 return error;
//             }

//             // people create team auto become leader
//             await repository.joinTeam(data![0].teamId, this.state.session!.user.id, 'leader');
//             // Reload user teams to include the new team
//             await this.loadUserTeams();

//             return { data, error };
//         } finally {
//             this.setState('loading', false);
//         }
//     }

//     // this function is ok if disabled teams table rls policy
//     async joinTeam(teamId: number, uId: string, role: string) {
//         this.setState('loading', true);
//         try {
//             const { data, error } = await repository.joinTeam(teamId, uId, role);
//             if (error) {
//                 console.error('Error joining team:', error);
//             } else {
//                 // Reload user teams to include the joined team
//                 await this.loadUserTeams();
//             }
//             return { data, error };
//         } catch (error) {
//             console.error('Error joining team:', error);
//         } finally {
//             this.setState('loading', false);
//         }
//     }

//     // not tested yet
//     async createTask(
//         title: string,
//         desc: string,
//         due?: number | null
//     ) {
//         this.setState('loading', true);
//         try {
//             const { data, error } = await repository.createTask(
//                 this.state.currentTeam.teamId,
//                 title || 'New Task',
//                 desc || 'Task description',
//                 due
//             );
//             if (error) {
//                 console.error('Error creating task:', error);
//                 return { data, error };
//             }
//             // Real-time subscription will automatically update the list
//             return { data, error };
//         } catch (error) {
//             console.error('Error creating task:', error);
//         } finally {
//             this.setState('loading', false);
//         }
//     }

//     // not tested yet
//     async clockInOut(recordData: any) {
//         try {
//             const result = await repository.clockInOut(recordData);
//             if (result.error) {
//                 console.error('Error clocking in/out:', result.error);
//             }
//             return result;
//         } catch (error) {
//             console.error('Error clocking in/out:', error);
//         }
//     }

//     // Cleanup
//     destroy() {
//         if (this.authSubscription) {
//             this.authSubscription.unsubscribe();
//         }

//         // Unsubscribe from all data channels
//         this.dataSubscriptions.forEach((channel, key) => {
//             channel.unsubscribe();
//         });
//         this.dataSubscriptions.clear();

//         this.listeners.clear();
//     }
// }

// export const vm = new ViewModel();
