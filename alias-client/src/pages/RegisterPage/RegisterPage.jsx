import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../fetchers/registerUser';

export default function RegisterPage() {
	const userRef = useRef();
	const errRef = useRef();
	const navigate = useNavigate();

	const [user, setUser] = useState('');
	const [pwd, setPwd] = useState('');
	const [errMsg, setErrMsg] = useState('');
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		userRef.current.focus();
	}, []);

	useEffect(() => {
		setErrMsg('');
	}, [user, pwd]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const registeredUser = await registerUser(user, pwd);
			console.log('User registered:', registeredUser);

			setUser('');
			setPwd('');
			setSuccess(true);
			navigate('/login');
		} catch (error) {
			setErrMsg('Registration failed. Please try again.');
			errRef.current.focus();
		}
	};

	return (
		<div className='container my-5'>
			{success ? (
				navigate('/login')
			) : (
				<section
					className='row justify-content-center gap-5'
					style={{ marginTop: '8rem' }}
				>
					<div className='col-lg-4 col-md-6'>
						<div className='card shadow-sm p-4'>
							<h2 className='text-center'>Welcome to Alias Game</h2>
							<p className='text-center'>
								Already have an Account? <Link to='/login'>Log In</Link>
							</p>

							<p
								ref={errRef}
								className={errMsg ? 'alert alert-danger' : 'offscreen'}
								aria-live={'assertive'}
							>
								{errMsg}
							</p>

							<form onSubmit={handleSubmit}>
								<div className='mb-3'>
									<label htmlFor='username' className='form-label'>
										Username
									</label>
									<input
										type='text'
										id='username'
										className='form-control'
										ref={userRef}
										autoComplete='off'
										onChange={(e) => setUser(e.target.value)}
										value={user}
										required
										placeholder='Enter your username'
									/>
								</div>

								<div className='mb-3'>
									<label htmlFor='password' className='form-label'>
										Password
									</label>
									<input
										type='password'
										id='password'
										className='form-control'
										onChange={(e) => setPwd(e.target.value)}
										value={pwd}
										required
										placeholder='Enter your password'
									/>
								</div>

								<button className='btn btn-lg btn-secondary w-100'>
									Create Account
								</button>
							</form>
						</div>
					</div>
					<div className='col-lg-6 col-md-8 mt-5 mt-lg-0'>
						<div className='p-4'>
							<h3 className='text-center mb-5'>About Alias Game</h3>
							<p>
								Alias is a fun and interactive word-guessing game where players
								form teams to compete. One teammate describes a word while the
								others try to guess it. The game promotes quick thinking and
								team coordination, and includes a chat feature for easy
								communication.
							</p>
							<p className='text-black fw-bold'>
								Ready to test your skills and have some fun? Register now and
								start playing with friends or challenge others in this exciting
								word-guessing game!
							</p>
						</div>
					</div>
				</section>
			)}
		</div>
	);
}
