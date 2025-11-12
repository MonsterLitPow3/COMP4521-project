// utils/Repository.ts
import { supabase } from './supabase-client';
import { RealtimeChannel } from '@supabase/supabase-js';

/* database schema
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ClockInOutRecords (
  mId bigint NOT NULL,
  teamId bigint NOT NULL,
  timestamp timestamp without time zone NOT NULL,
  inOut character varying NOT NULL,
  locationLatitude double precision,
  locationLongitude double precision,
  CONSTRAINT ClockInOutRecords_pkey PRIMARY KEY (mId, teamId),
  CONSTRAINT CheckInOutRecords_teamId_fkey FOREIGN KEY (teamId) REFERENCES public.Teams(teamId),
  CONSTRAINT CheckInOutRecords_mId_fkey FOREIGN KEY (mId) REFERENCES public.TeamMembers(mId)
);
CREATE TABLE public.MemberTasks (
  mId bigint NOT NULL,
  taskId bigint NOT NULL,
  CONSTRAINT MemberTasks_pkey PRIMARY KEY (mId, taskId),
  CONSTRAINT MemberTasks_mId_fkey FOREIGN KEY (mId) REFERENCES public.TeamMembers(mId),
  CONSTRAINT MemberTasks_taskId_fkey FOREIGN KEY (taskId) REFERENCES public.Tasks(taskId)
);
CREATE TABLE public.TaskProgress (
  pId bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  taskId bigint NOT NULL,
  desc text NOT NULL,
  CONSTRAINT TaskProgress_pkey PRIMARY KEY (pId, taskId),
  CONSTRAINT TaskProgress_taskId_fkey FOREIGN KEY (taskId) REFERENCES public.Tasks(taskId)
);
CREATE TABLE public.Tasks (
  taskId bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  teamId bigint NOT NULL,
  title character varying NOT NULL,
  desc character varying NOT NULL,
  due timestamp without time zone,
  CONSTRAINT Tasks_pkey PRIMARY KEY (taskId),
  CONSTRAINT Tasks_teamId_fkey FOREIGN KEY (teamId) REFERENCES public.Teams(teamId)
);
CREATE TABLE public.TeamMembers (
  mId bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  teamId bigint NOT NULL,
  role character varying NOT NULL,
  uId uuid NOT NULL,
  CONSTRAINT TeamMembers_pkey PRIMARY KEY (mId, teamId, uId),
  CONSTRAINT TeamMembers_teamId_fkey FOREIGN KEY (teamId) REFERENCES public.Teams(teamId),
  CONSTRAINT TeamMembers_uId_fkey FOREIGN KEY (uId) REFERENCES auth.users(id)
);
CREATE TABLE public.Teams (
  teamId bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  name character varying NOT NULL,
  checkInTime time without time zone,
  checkOutTime time without time zone,
  locationLatitude double precision,
  locationLongitude double precision,
  CONSTRAINT Teams_pkey PRIMARY KEY (teamId)
);
*/

// Repository class to interact with Supabase
class Repository {
    signUpWithEmail = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        console.log('Repo: Sign-up data:', data);
        return {data, error};
    }

    signInWithEmail = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        console.log('Repo: Sign-in data:', data);
        return {data, error};
    }

    signOut = async () => {
        const { error } = await supabase.auth.signOut();
        console.log('Repo: Sign-out error:', error);
        return { error };
    }


    fetchUser = async () => {
        const currentUser = await supabase.auth.getUser();
        console.log('Repo: Fetching user:', currentUser);
        return currentUser.data.user;
    }

    // Supabase real-time subscription
    subscribeToAuth = (callback: (event: any) => void) => {
        return supabase.auth.onAuthStateChange((event, session) => {
            console.log('Repo: Auth state change event:', event, 'Session:', session);
            callback({ event, session });
        });
    }

    subscribeToTable = (
        table: string,
        onChange: (payload: any) => void,
        filter?: string
    ): RealtimeChannel => {
        const channel = supabase
            .channel(`public:${table}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: table,
                    ...(filter ? { filter } : {})
                },
                onChange
            )
            .subscribe();

        console.log(`Repo: Subscribing to table ${table} with filter: ${filter}`);
        return channel;
    }

    // Team methods
    fetchUserTeams = async (userId: string) => {
        const { data, error } = await supabase
            .from('TeamMembers')
            .select(`
                teamId,
                Teams!TeamMembers_teamId_fkey (
                    teamId,
                    name,
                    checkInTime,
                    checkOutTime,
                    locationLatitude,
                    locationLongitude
                )
            `)
            .eq('uId', userId);
        
        console.log('Repo: Fetching user teams:', data, 'Error:', error);
        return { data, error };
    }

    fetchTeamTasks = async (teamId: number) => {
        const { data, error } = await supabase
            .from('Tasks')
            .select('*')
            .eq('teamId', teamId)
            .order('due', { ascending: true });
        
        console.log('Repo: Fetching team tasks:', data, 'Error:', error);
        return { data, error };
    }

    fetchMemberTasks = async (mId: number) => {
        const { data, error } = await supabase
            .from('MemberTasks')
            .select(`
                taskId,
                Tasks (
                    taskId,
                    title,
                    desc,
                    due,
                    teamId
                )
            `)
            .eq('mId', mId);
        
        console.log('Repo: Fetching member tasks:', data, 'Error:', error);
        return { data, error };
    }

    fetchClockInOutRecords = async (mId: number, teamId: number) => {
        const { data, error } = await supabase
            .from('ClockInOutRecords')
            .select('*')
            .eq('mId', mId)
            .eq('teamId', teamId)
            .order('timestamp', { ascending: false });
    
        console.log('Repo: Fetching clock in/out records:', data, 'Error:', error);
        return { data, error };
    }

    // Mutation methods
    createTeam = async (
        teamName: string,
        checkInTime: number | null,
        checkOutTime: number | null,
        locationLatitude: number | null,
        locationLongitude: number | null
    ) => {
        const { data, error } = await supabase
            .from('Teams')
            .insert([{ name: teamName, checkInTime, checkOutTime, locationLatitude, locationLongitude }])
            .select();
        
        console.log('Repo: Adding team:', data, 'Error:', error);
        return { data, error };
    }

    joinTeam = async (teamId: number, uId: string, role: string) => {
        const { data, error } = await supabase
            .from('TeamMembers')
            .insert([{ teamId, uId, role }])
            .select();
        
        console.log('Repo: Joining team:', data, 'Error:', error);
        return { data, error };
    }

    createTask = async (
        teamId: number,
        title: string,
        desc: string,
        due?: number | null
    ) => {
        const dueDate = due ? new Date(due).toISOString() : null;
        const { data, error } = await supabase
            .from('Tasks')
            .insert([{ teamId, title, desc, due: dueDate }])
            .select();
        
        console.log('Repo: Creating task:', data, 'Error:', error);
        return { data, error };
    }

    assignTaskToMember = async (mId: number, taskId: number) => {
        const { data, error } = await supabase
            .from('MemberTasks')
            .insert([{ mId, taskId }]);
        
        console.log('Repo: Assigning task to member:', data, 'Error:', error);
        return { data, error };
    }

    clockInOut = async (recordData: {
        mId: number;
        teamId: number;
        timestamp: string;
        inOut: 'IN' | 'OUT';
        locationLatitude?: number;
        locationLongitude?: number;
    }) => {
        const { data, error } = await supabase
            .from('ClockInOutRecords')
            .insert([recordData])
            .select();
        
        console.log('Repo: Clocking in/out:', data, 'Error:', error);
        return { data, error };
    }

    // Real-time subscription methods
    subscribeToTeamTasks = (
        teamId: number, 
        onChange: (payload: any) => void
    ): RealtimeChannel => {
        return this.subscribeToTable('Tasks', onChange, `teamId=eq.${teamId}`);
    }

    subscribeToMemberTasks = (
        mId: number,
        onChange: (payload: any) => void
    ): RealtimeChannel => {
        return supabase
        .channel(`member-tasks-${mId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'MemberTasks',
                filter: `mId=eq.${mId}`
            },
            async (payload) => {
            // When MemberTasks changes, fetch the updated task details
            if (payload.new) {
                const { data } = await supabase
                    .from('Tasks')
                    .select('*')
                    .eq('taskId', (payload.new as any).taskId)
                    .single();
                
                    onChange({ ...payload, taskDetails: data });
            } else {
                onChange(payload);
            }
            }
        )
        .subscribe();
    }

    subscribeToClockRecords = (
        mId: number,
        teamId: number,
        onChange: (payload: any) => void
    ): RealtimeChannel => {
        return this.subscribeToTable(
            'ClockInOutRecords', 
            onChange, 
            `mId=eq.${mId}&teamId=eq.${teamId}`
        );
    }
}

export const repository = new Repository();
