export default function ErrorMessage({ error }) {
	return (
		<div className='d-flex justify-content-center align-items-center vh-100'>
			<div className='alert alert-danger w-50 text-center' role='alert'>
				<strong>Error:</strong> {error}
			</div>
		</div>
	);
}
