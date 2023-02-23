import { gql, useMutation } from '@apollo/client';

const MUTATION = gql`
  mutation Upload($file: Upload) {
    UploadFile(file: $file) {
      url
    }
  }
`;

const App = () => {
  const [mutate, { data, loading, error }] = useMutation(MUTATION);

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (file) await mutate({ variables: { file } });
  };

  return (
    <div>
      <input type='file' required onChange={handleChange} />
      {loading && <p>Loading...</p>}
      {error && <p>Error : Please try again</p>}

      {data && <img src={data.UploadFile.url} alt='uploaded' />}
    </div>
  );
};

export default App;
