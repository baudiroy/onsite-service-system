const express = require('express');

const { AppointmentController } = require('../controllers/AppointmentController');
const { requirePermission } = require('../middlewares/requirePermission');
const { validateRequest } = require('../middlewares/validateRequest');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  createAppointmentValidator,
  updateAppointmentValidator,
  listAppointmentsValidator
} = require('../validators/dispatchAppointmentValidators');

const caseAppointmentsRouter = express.Router({ mergeParams: true });
const appointmentsRouter = express.Router();
const appointmentController = new AppointmentController();

caseAppointmentsRouter.post(
  '/',
  requirePermission('appointments.manage'),
  validateRequest(createAppointmentValidator),
  asyncHandler(appointmentController.createAppointment)
);

caseAppointmentsRouter.get(
  '/',
  requirePermission('appointments.manage'),
  validateRequest(listAppointmentsValidator),
  asyncHandler(appointmentController.listAppointments)
);

appointmentsRouter.patch(
  '/:appointmentId',
  requirePermission('appointments.manage'),
  validateRequest(updateAppointmentValidator),
  asyncHandler(appointmentController.updateAppointment)
);

module.exports = {
  caseAppointmentsRouter,
  appointmentsRouter
};
