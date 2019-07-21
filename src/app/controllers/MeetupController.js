import { isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import * as Yup from 'yup';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const page = req.query.page || 1;
    const date = parseISO(req.query.date) || new Date();

    const meetups = Meetup.findAll({
      where: {
        date: { [Op.between]: [startOfDay(date), endOfDay(date)] }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name']
        }
      ],
      limit: 10,
      offset: (page - 1) * 10
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required()
    });

    const isValid = await schema.isValid(req.body);
    if (!isValid) {
      return res.status(400).json({ error: 'Validation Failed' });
    }

    const { title, description, location, date } = req.body;
    const user_id = req.userId;

    const pastDate = isBefore(parseISO(date), new Date());
    if (pastDate) {
      return res
        .status(400)
        .json({ error: "Can't create a meeting on a past date." });
    }

    const meetup = Meetup.create({
      title,
      description,
      location,
      date,
      user_id
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required()
    });

    const isValid = await schema.isValid(req.body);
    if (!isValid) {
      return res.status(400).json({ error: 'Validation Failed' });
    }

    const meetup = await Meetup.findByPk(req.params.id);

    if (meetup.user_id !== req.userId) {
      return res
        .status(403)
        .json({ error: 'Not allowed to update this meetup' });
    }

    if (meetup.past) {
      return res.status(400).json({ error: 'Meetup already happened.' });
    }

    const { date } = req.body;
    const pastDate = isBefore(parseISO(date), new Date());
    if (pastDate) {
      return res
        .status(400)
        .json({ error: "Can't create a meeting on a past date." });
    }

    await meetup.update();

    return res.json(meetup);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    if (meetup.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    if (meetup.past) {
      return res.status(400).json({ error: 'Meetup already happenned' });
    }

    await meetup.destroy();

    return res.json({ message: 'Successfully cancelled' });
  }
}

export default new MeetupController();
