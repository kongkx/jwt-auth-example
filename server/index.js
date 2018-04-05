const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const randtoken = require('rand-token');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const webpack = require('webpack');

const webpackConfig = require(path.resolve(process.cwd(), 'webpack.config.js'));
const demoUsers = require('./demoUsers');

const PORT = 3000;
const SECRET = 'JWT_SECRET';
const TTL = 10;

const compiler = webpack(webpackConfig);
const webpackMiddleware = webpackDevMiddleware(compiler, {
  publicPath: webpackConfig.output.publicPath
});
const hotMiddleware = webpackHotMiddleware(compiler);

const app = express();
const refreshTokens = {};

const jwtOpts = {};
jwtOpts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOpts.secretOrKey = SECRET;

passport.use(
  new JwtStrategy(jwtOpts, function(jwtPayload, done) {
    const expirationDate = new Date(jwtPayload.exp * 1000);
    if (expirationDate < new Date()) {
      return done(null, false);
    }
    const user = jwtPayload;
    done(null, user);
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(webpackMiddleware);
app.use(hotMiddleware);

passport.serializeUser(function(user, done) {
  console.log(user);
  done(null, user.username);
});

/*
passport.deserializeUser(function (username, done) {
  done(null, username)
})
*/

/**
 * Login
 *
 * Response with AccessToken and RefreshToken
 */
app.post('/api/login', function(req, res, next) {
  const username = req.body.username;
  const password = req.body.password;
  const user = demoUsers.find(
    item => item.username === username && item.password === password
  );

  if (!user) {
    res.sendStatus(401);
    return;
  }

  const basicInfo = {
    username: user.username,
    id: user.id
  };

  const token = jwt.sign(basicInfo, SECRET, { expiresIn: TTL });
  const refreshToken = randtoken.uid(256);
  refreshTokens[refreshToken] = username;
  res.json({ accessToken: token, refreshToken: refreshToken });
});

/**
 * Get New Token by Refresh Token
 */
app.post('/api/token', function(req, res, next) {
  const username = req.body.username;
  const refreshToken = req.body.refreshToken;
  if (
    refreshToken in refreshTokens &&
    refreshTokens[refreshToken] === username
  ) {
    const user = demoUsers.find(user => user.username === username);

    if (!user) {
      res.sendStatus(401);
    }
    const basicInfo = {
      username: user.username,
      id: user.id
    };
    const token = jwt.sign(user, SECRET, { expiresIn: TTL });
    res.json({
      accessToken: token
    });
  } else {
    res.sendStatus(401);
  }
});

/**
 * Disable a refresh token
 *
 * TODO auth middleware
 */
app.post('/api/token/reject', function(req, res, next) {
  const refreshToken = req.body.refreshToken;
  if (refreshToken in refreshTokens) {
    delete refreshTokens[refreshToken];
  }
  res.sendStatus(204);
});

/**
 * Authentication Required Route
 */
app.get('/api/user-info', passport.authenticate('jwt'), function(req, res) {
  const user = demoUsers.find(item => item.id == req.user.id);
  setTimeout(() => {
    res.json({
      success: 'Get User Info',
      user
    });
  }, 300);
});

app.listen(PORT, () => console.log(`listening on port ${PORT}!`));
