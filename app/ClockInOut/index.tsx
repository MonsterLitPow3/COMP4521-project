import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MoonStarIcon, StarIcon, SunIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Image, type ImageStyle, View, TextInput, Pressable } from 'react-native';
import { supabase } from '@/utils/supabase';

const SCREEN_OPTIONS = {
    title: 'React Native Reusables',
    headerTransparent: true,
    headerRight: () => <ThemeToggle />,
};

const IMAGE_STYLE: ImageStyle = {
    height: 76,
    width: 76,
};

type TeamType = {
    teamId: number;
    mId: number;
    role: string;
    name: string;
    checkInTime: string;
    checkOutTime: string;
    locationLatitude: number;
    locationLongitude: number;
    ClockInStatus: boolean;
};

const getUserTeams = async (uid: string): Promise<TeamType[]> => {
    const { data, error } = await supabase
        .from('TeamMembers')
        .select(
            'mId, teamId, role, ClockInStatus, Teams!TeamMembers_teamId_fkey ( name, checkInTime, checkOutTime, locationLatitude, locationLongitude )'
        )
        .eq('uId', uid)

    if (error) {
        console.error('Error fetching user teams:', error)
        return [];
    }
    if (!data) {
        console.error('No data returned for user teams')
        return [];
    }

    const formattedData: TeamType[] = data.map((item) => ({
        teamId: item.teamId,
        mId: item.mId,
        role: item.role,
        name: item.Teams.name,
        checkInTime: item.Teams.checkInTime,
        checkOutTime: item.Teams.checkOutTime,
        locationLatitude: item.Teams.locationLatitude,
        locationLongitude: item.Teams.locationLongitude,
        ClockInStatus: item.ClockInStatus
    }));

    console.log('Fetched user teams:', formattedData);

    return formattedData;
}

export default function ClockInOutScreen() {
    const [user, setUser] = React.useState<any>(null);
    const [currentTime, setCurrentTime] = React.useState<string>('');
    const [teams, setTeams] = React.useState<TeamType[]>([]);
    const [selectedTeamId, setSelectedTeamId] = React.useState<number | null>(null);
    const [clockInStatus, setClockInStatus] = React.useState<boolean | null>(null);
    const [loading, setLoading] = React.useState<boolean>(false);

    React.useEffect(() => {
        if (selectedTeamId === null) {
            setClockInStatus(null);
            return;
        }
        const selectedTeam = teams.find(team => team.teamId === selectedTeamId);
        setClockInStatus(selectedTeam ? selectedTeam.ClockInStatus : null);
    }, [selectedTeamId, teams]);

    React.useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };

        fetchUser();
    }, []);

    React.useEffect(() => {
        if (!user?.id) return;
        let mounted = true;
        getUserTeams(user.id)
            .then((t) => { if (mounted) setTeams(t); })
            .catch(console.error);
        return () => { mounted = false; };
    }, [user?.id]);

    React.useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            setCurrentTime(timeString);
        };

        updateTime();
        const intervalId = setInterval(updateTime, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const handleClockInOut = async () => {
        setLoading(true);
        try {
            if (selectedTeamId === null || user === null) {
                console.error('No team selected or user not logged in');
                setLoading(false);
                return;
            }
            const team = teams.find(team => team.teamId === selectedTeamId);

            const { data, error } = await supabase
                .from('TeamMembers')
                .update({ ClockInStatus: !clockInStatus })
                .eq('uId', user.id)
                .eq('teamId', selectedTeamId)
                .select();

            if (error) {
                console.error('Error updating clock-in status:', error);
            } else {
                console.log('Clock-in status updated:', data);
                setClockInStatus(!clockInStatus);
                setTeams((prevTeams) =>
                    prevTeams.map((team) =>
                        team.teamId === selectedTeamId
                            ? { ...team, ClockInStatus: !clockInStatus }
                            : team
                    )
                );

                // insert clock-in/out record
                const now = new Date();
                const { data: recordData, error: recordError } = await supabase
                    .from('ClockInOutRecords')
                    .insert([{
                        mId: team?.mId,
                        teamId: selectedTeamId,
                        timestamp: now.toISOString(),
                        inOut: !clockInStatus ? 'IN' : 'OUT',
                    }]);

                if (recordError) {
                    console.error('Error inserting clock-in/out record:', recordError);
                } else {
                    console.log('Clock-in/out record inserted:', recordData);
                }
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoading(false);
        }   
    };

    return (
        <View className="flex-1 items-center justify-center p-4">
            <Text className="text-2xl font-bold mb-4">Clock In/Out</Text>
            <Text className="text-lg">{currentTime}</Text>
            <Text className="text-md mt-2">Teams:</Text>
            <View className="flex-row gap-2">
                <Button
                variant="outline"
                disabled={loading || selectedTeamId == null}
                onPress={handleClockInOut}
                className="flex-1"
            >
                <Text>{loading ? 'Please wait...' : clockInStatus ? 'Clock Out' : 'Clock In'}</Text>
            </Button>
            </View>
            <Text>Clock in status: {clockInStatus !== null ? (clockInStatus ? 'Clocked In' : 'Clocked Out') : 'No team selected'}</Text>
            {teams.map((team) => {
                const isSelected = team.teamId === selectedTeamId;
                return (
                    <Pressable
                        key={team.teamId}
                        onPress={() => setSelectedTeamId(team.teamId)}
                        className={`w-full p-2 my-1 rounded ${isSelected ? 'bg-blue-500' : 'bg-gray-200'
                            }`}
                    >
                        <Text className={`text-sm ${isSelected ? 'text-white' : 'text-black'}`}>
                            {team.name}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const THEME_ICONS = {
    light: SunIcon,
    dark: MoonStarIcon,
};

function ThemeToggle() {
    const { colorScheme, toggleColorScheme } = useColorScheme();

    return (
        <Button
            onPressIn={toggleColorScheme}
            size="icon"
            variant="ghost"
            className="ios:size-9 rounded-full web:mx-4">
            <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-5" />
        </Button>
    );
}