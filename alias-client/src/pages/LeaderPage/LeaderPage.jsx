import { useEffect, useRef, useState } from 'react';
import Timer from '../../components/Timer/Timer.jsx';
import { useNavigate } from 'react-router-dom';
import { checkAnswer } from '../../fetchers/checkAnswer';
import { saveAnswer } from '../../fetchers/saveAnswer.js';
import getSelectedWordId from '../../fetchers/getSelectedWordId.js';

export default function LeaderPage({ getTokens, teamObj, setTeam }) {
	// const access_token = getTokens().access_token;
	const { roomId, _id: teamId } = teamObj;

	const [leaderWord, setLeaderWord] = useState('');
	const [isTimeUp, setIsTimeUp] = useState(false);
	const [message, setMessage] = useState('');
	const [wordId, setWordId] = useState(null);

	const wordRef = useRef();
	const navigate = useNavigate();

	// Fetch the selected word when the component loads
	useEffect(() => {
		const fetchWordId = async () => {
			try {
				const selectedWordId = await getSelectedWordId(roomId, teamId);
				setWordId(selectedWordId);
			} catch {
				setMessage('Failed to load the word ID. Please try again later.');
			}
		};

		fetchWordId();
	}, [roomId, teamId]);

  useEffect(() => {
    const fetchWordId = async () => {
      try {
        const selectedWordId = await getSelectedWordId(roomId, teamId);
        console.log("selectedWordId: ", selectedWordId);
        setWordId(selectedWordId);
      } catch {
        setMessage("Failed to load the word ID. Please try again later.");
      }
    };

		// Time runs out
		if (isTimeUp) return;

		// Validate if the input is empty or whitespace-only
		if (!leaderWord.trim()) {
			setMessage('You must provide a valid decision before submitting.');
			return;
		}

		if (!wordId) {
			setMessage('Word ID is not available. Please try again later.');
			return;
		}

		try {
			// Check if the answer is correct by making the API call
			const isCorrect = await checkAnswer(leaderWord, wordId);
			const success = await saveAnswer(roomId, teamId, leaderWord, isCorrect);

			if (success) {
				setMessage(
					isCorrect
						? 'Answer is correct and recorded!'
						: 'Answer is incorrect but recorded!'
				);
				setLeaderWord('');
				wordRef.current.disabled = true;
			} else {
				setMessage('Failed to submit the answer. Please try again later.');
			}
		} catch {
			setMessage('Failed to submit the answer. Please try again later.');
		}
	};

	const handleTimeUp = () => {
		setIsTimeUp(true);
		setLeaderWord(''); // Clear the input field when time is up
		wordRef.current.disabled = true;
	};

	// Trigger navigation when time is up
	useEffect(() => {
		if (isTimeUp) {
			navigate('/teams-result');
		}
	}, [isTimeUp, navigate]);

	return (
		<div className='container my-5'>
			<section
				className='row justify-content-center align-items-center gap-5'
				style={{ marginTop: '8rem' }}
			>
				<div className='col-md-6 text-center'>
					<h2 className='mb-4'>
						{isTimeUp ? "Time's up!" : 'Answer Before Time Runs Out!'}
					</h2>
					<Timer startTime={10} onTimeOut={handleTimeUp} small={false} />
				</div>
				<div className='col-md-6'>
					<form onSubmit={handleSubmit} className='p-4 border rounded shadow'>
						<div className='mb-3'>
							<label htmlFor='leaderWord' className='form-label'>
								Your Final Decision
							</label>
							<input
								type='text'
								id='leaderWord'
								className='form-control form-control-lg'
								ref={wordRef}
								autoComplete='off'
								onChange={(e) => setLeaderWord(e.target.value)}
								value={leaderWord}
								required
								placeholder={
									isTimeUp
										? "Time's up! Can't submit a decision."
										: 'Write your final decision'
								}
								disabled={message !== '' || !wordId}
							/>
						</div>
						<button
							className='btn btn-lg btn-success w-100'
							disabled={isTimeUp || message !== '' || !wordId}
						>
							Submit Your Answer
						</button>
					</form>
					{message && <div className='alert alert-info mt-3'>{message}</div>}{' '}
				</div>
			</section>
		</div>
	);
}
