import * as Yup from 'yup';
import JWT from 'jsonwebtoken';

import User from '../models/User';

class UserController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string()
        .min(3)
        .required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .min(6)
        .required()
    });

    const isValid = await schema.isValid(req.body);
    if (!isValid) {
      return res.status(400).json({ error: 'Validation Failed' });
    }

    const emailInUse = await User.findOne({
      where: { email: req.body.email }
    });
    if (emailInUse) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const { id, name, email } = await User.create(req.body);

    return res.json({
      user: {
        id,
        name,
        email
      },
      token: JWT.sign(
        {
          id
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '7d'
        }
      )
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().min(3),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      )
    });

    const isValid = await schema.isValid(req.body);
    if (!isValid) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const user = await User.findByPk(req.userId);

    const { email, oldPassword } = req.body;

    if (email && email === user.email) {
      const emailInUse = await User.findOne({
        where: { email: req.body.email }
      });
      if (emailInUse) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({
        error: 'Invalid password'
      });
    }

    const { id, name } = await user.update(req.body);

    return res.json({ id, name, email });
  }
}

export default new UserController();
