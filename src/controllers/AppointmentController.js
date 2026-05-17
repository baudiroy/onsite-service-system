const { AppointmentService } = require('../services/AppointmentService');
const { successResponse, paginationResponse } = require('../utils/responses');

class AppointmentController {
  constructor({ appointmentService = new AppointmentService() } = {}) {
    this.appointmentService = appointmentService;
  }

  createAppointment = async (req, res) => {
    const data = await this.appointmentService.createAppointment(
      req.params.caseId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data, 201);
  };

  updateAppointment = async (req, res) => {
    const data = await this.appointmentService.rescheduleAppointment(
      req.params.appointmentId,
      req.body,
      req.user,
      req
    );
    return successResponse(res, data);
  };

  listAppointments = async (req, res) => {
    const result = await this.appointmentService.listAppointments(req.params.caseId, req.query, req.user);
    return paginationResponse(res, result.data, result.pagination);
  };
}

module.exports = {
  AppointmentController
};
