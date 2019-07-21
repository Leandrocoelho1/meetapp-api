import { isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import * as Yup from 'yup';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const page = req.query.page || 1;
    const { date } = req.query;

    const searchDate = date ? parseISO(date) : new Date();

    const meetups = await Meetup.findAll({
      where: {
        date: { [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)] }
      },
      include: [
        {
          model: User,
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
      file_id: Yup.number().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required()
    });

    const isValid = await schema.isValid(req.body);
    if (!isValid) {
      return res.status(400).json({ error: 'Validation Failed' });
    }

    const { title, description, location, date, file_id } = req.body;
    const user_id = req.userId;

    const pastDate = isBefore(parseISO(date), new Date());
    if (pastDate) {
      return res
        .status(400)
        .json({ error: "Can't create a meeting on a past date." });
    }

    const meetup = await Meetup.create({
      title,
      description,
      location,
      date,
      user_id,
      file_id
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
      file_id: Yup.number()
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

    if (date) {
      const pastDate = isBefore(parseISO(date), new Date());
      if (pastDate) {
        return res
          .status(400)
          .json({ error: "Can't schedule a meeting on a past date." });
      }
    }

    await meetup.update(req.body);

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
