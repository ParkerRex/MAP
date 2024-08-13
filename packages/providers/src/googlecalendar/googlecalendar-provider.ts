import type { calendar_v3 } from "googleapis";
import type { Provider } from "../interface";
import { GoogleCalendarApi } from "./googlecalendar-api";

export class GoogleCalendarProvider implements Provider {
  #api: GoogleCalendarApi;

  constructor() {
    this.#api = new GoogleCalendarApi();
  }

  async getCalendarList(
    params: calendar_v3.Params$Resource$Calendarlist$List = {},
  ) {
    return this.#api.getCalendarList(params);
  }

  async getEvents(params: calendar_v3.Params$Resource$Events$List) {
    return this.#api.getEvents(params);
  }

  async createEvent(params: calendar_v3.Params$Resource$Events$Insert) {
    return this.#api.createEvent(params);
  }

  async updateEvent(params: calendar_v3.Params$Resource$Events$Update) {
    return this.#api.updateEvent(params);
  }

  async deleteEvent(params: calendar_v3.Params$Resource$Events$Delete) {
    return this.#api.deleteEvent(params);
  }

  async deleteCalendar(params: calendar_v3.Params$Resource$Calendars$Delete) {
    return this.#api.deleteCalendar(params);
  }

  async updateCalendar(params: calendar_v3.Params$Resource$Calendars$Update) {
    return this.#api.updateCalendar(params);
  }

  async getCalendarResources(
    params: calendar_v3.Params$Resource$Freebusy$Query,
  ) {
    return this.#api.getCalendarResources(params);
  }

  async getColors() {
    return this.#api.getColors();
  }

  async watchEvents(params: calendar_v3.Params$Resource$Events$Watch) {
    return this.#api.watchEvents(params);
  }

  async stopChannel(params: calendar_v3.Params$Resource$Channels$Stop) {
    return this.#api.stopChannel(params);
  }
}
