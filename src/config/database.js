require('dotenv').config();

module.exports = {
  dialect: 'postgres',
  host: '192.168.99.100',
  port: process.env.PG_PORT,
  username: process.env.PG_USER,
  password: process.env.PG_PASS,
  database: 'meetapp',
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true
  }
};
