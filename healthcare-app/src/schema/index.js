import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  # User Type Definition
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    specialization: String
    vitals: [Vital]
    appointments: [Appointment]
    prescriptions: [Prescription]
  }

  # Appointment Type Definition
  type Appointment {
    id: ID!
    patient: User!
    doctor: User!
    date: String!
    time: String!
    status: String!
  }

  type Prescription {
  id: ID!
  patient: User!
  doctor: User!
  medicines: [String!]! # Ensure this is non-nullable and not empty
  diagnosis: String!
  date: String!
}

  # Vital Type Definition
  type Vital {
    id: ID!
    patient: User!
    bloodPressure: String
    heartRate: String
    temperature: String
    date: String!
  }

  # Doctor Type Definition
  type Doctor {
    id: ID!
    name: String!
    email: String!
    specialization: String
  }

  # Specialization Type Definition
  type Specialization {
    id: ID!
    name: String!
  }

  # Authentication Payload for Login
  type AuthPayload {
    token: String!
    user: User!
  }

  # Register Response
  type RegisterResponse {
    message: String!
    user: User!
  }

  # Query Definitions
  type Query {
    getUser(id: ID!): User
    getAppointmentsByDate(date: String!): [Appointment]
    getVitals(patientId: ID!): [Vital]
    getDoctors: [Doctor!]!
    getSpecializations: [Specialization!]!
    getPrescription(patientId: ID!, doctorId: ID!): Prescription

  }

  # Mutation Definitions
  type Mutation {
    register(
      name: String!
      email: String!
      password: String!
      role: String!
      specialization: String
    ): RegisterResponse

    login(email: String!, password: String!): AuthPayload

    bookAppointment(
      patientId: ID!
      doctorId: ID!
      date: String!
      time: String!
    ): Appointment!

    updateAppointmentStatus(
      appointmentId: ID!
      status: String!
    ): Appointment!

    updateAppointmentDetails(
    appointmentId: ID!
    newDoctorId: ID
    newDate: String
    newTime: String
  ): Appointment!

    cancelAppointment(
      appointmentId: ID!
    ): Appointment!

     prescribeMedicine(
    patientId: ID!
    doctorId: ID!
    medicines: [String]!
    diagnosis: String!
  ): Prescription
  }
`;
