import { useWebSocket } from "./WebSocketContext";
import { useDispatch } from 'react-redux';
import ApiRequests from './ApiRequests';
import { useNotification } from './NotificationContext';
import { tourCustom } from "./redux/actions/gameActions";

export function useGameActions({ userData, customMatch, cur_mod, myProfile }) {
	const { sendMessage } = useWebSocket();
    const dispatch = useDispatch();
    const { showConfirmModal } = useNotification();

	const handleGameStart = async () => {
		try {
			const response_me = await ApiRequests('/api/status/me/get-state/');
			if (response_me.message === 'available' || (response_me.message === 'in-queue' && customMatch)) {
				const response_other = await ApiRequests(`/api/status/${userData.id}/get-state/`);
				if (response_me.mode != response_other.mode) {
					alert('상대방과 Mod가 다릅니다.');
					return;
				}
				if (response_other.message === 'available') {
					let mode = cur_mod === 'Casual Mod' ? 'casual' : 'tournament'
					if (response_me.message === 'available') {
						const response_status = await ApiRequests('/api/status/me/state-update/',  {
							method: 'PATCH', body: JSON.stringify({ status: 'in-queue' }), headers: { 'Content-Type': 'application/json' }
						})
						if (response_status.message === 'Not Found status')
							alert('오류 발생');
						sendMessage({ type: 'refresh' });
						if (mode === 'tournament' && !customMatch) {
							let temp = await showConfirmModal(
								'사용 할 닉네임을 입력해주세요.',
								(inputText) => {
									return inputText;
								},
								() => {
									return 'cancle'
								},
								'tournament'
							)
							try {   
	
								const response = await ApiRequests(`/api/validate/?nickname=${encodeURIComponent(temp)}`, {
									method: 'GET',
								});
							} catch (error) {
								alert('입력 형식에 오류가 있습니다.');
								await ApiRequests('/api/status/me/state-update/',  {
									method: 'PATCH', body: JSON.stringify({ status: 'available' }), headers: { 'Content-Type': 'application/json' }
								})
							}
							if (temp === 'cancle') return;
							if (temp === '') temp = myProfile.username;
							dispatch(tourCustom(0, [{ user_id: myProfile.userid, tournament_name: temp }]));
						}
					}
					sendMessage({ type: "game_request", from_user: myProfile.userid, to_user: userData.id, mode: mode});
				} else if (response_other.message === 'in-queue') {
					alert('상대방이 다른 작업 중 입니다.');
				} else {
					alert('상대방이 게임 진행 중 입니다.');
				}
			}else if (response_me.message === 'in-queue') {
				alert('이미 요청 진행 중 입니다.');
			} else {
				alert('현재 게임 진행 중 입니다.')
			}
		} catch (error) {
			console.error('Failed to game', error);
		}
	};

	return { handleGameStart };
}
