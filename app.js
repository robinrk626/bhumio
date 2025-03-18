const restana = require('restana');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const {
  errorResponse,
  STATUS_CODES: { STATUS_CODE_FAILURE, STATUS_CODE_DATA_NOT_FOUND },
} = require('./utils/response/response.handler');
const { getConfig } = require('./config');
const routes = require('./routes');
const config = getConfig();

const DEFAULT_PORT = 3000;

const app = restana();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(compression());

routes(app);

app.use((req, res) => errorResponse({
  code: STATUS_CODE_DATA_NOT_FOUND,
  res,
  message: 'Route not found',
}));

app.use((error, req, res) => errorResponse({
  code: STATUS_CODE_FAILURE,
  res,
  error,
  message: error.message,
}));

const port = config.PORT || DEFAULT_PORT;
app.start(port).then(() => {
  console.log(`Server started at port ${port}`);
  try {
  } catch (err) {
    console.error("Failed to start server:", err);
  }
}).catch((error) => {
  console.log(error)
});