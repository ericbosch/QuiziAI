import { TriviaQuestion } from "../types";

/**
 * Mock trivia batch for testing and development
 * Contains 10 Spanish trivia questions across different categories
 */
export const MOCK_TRIVIA_BATCH: TriviaQuestion[] = [
  {
    question: "¿En qué año comenzó la Revolución Francesa?",
    options: ["1789", "1776", "1812", "1492"],
    correctAnswerIndex: 0,
    funFact: "La Revolución Francesa marcó el fin del absolutismo y el inicio de la Edad Contemporánea."
  },
  {
    question: "¿Cuál es el planeta más grande del Sistema Solar?",
    options: ["Marte", "Saturno", "Júpiter", "Neptuno"],
    correctAnswerIndex: 2,
    funFact: "Júpiter es tan grande que todos los demás planetas podrían caber dentro de él."
  },
  {
    question: "¿Quién dirigió la película 'El Padrino'?",
    options: ["Steven Spielberg", "Francis Ford Coppola", "Martin Scorsese", "Quentin Tarantino"],
    correctAnswerIndex: 1,
    funFact: "Marlon Brando usó prótesis dentales para darle a Vito Corleone su característica mandíbula."
  },
  {
    question: "¿Cuál es la capital de Australia?",
    options: ["Sídney", "Melbourne", "Canberra", "Brisbane"],
    correctAnswerIndex: 2,
    funFact: "Canberra fue diseñada específicamente para ser la capital de Australia en 1913."
  },
  {
    question: "¿Qué elemento químico tiene el símbolo 'Au'?",
    options: ["Plata", "Oro", "Aluminio", "Cobre"],
    correctAnswerIndex: 1,
    funFact: "El símbolo 'Au' proviene del latín 'aurum', que significa 'brillante amanecer'."
  },
  {
    question: "¿En qué año cayó el Muro de Berlín?",
    options: ["1987", "1989", "1991", "1985"],
    correctAnswerIndex: 1,
    funFact: "El Muro de Berlín cayó el 9 de noviembre de 1989, marcando el fin de la Guerra Fría."
  },
  {
    question: "¿Quién escribió 'Cien años de soledad'?",
    options: ["Mario Vargas Llosa", "Gabriel García Márquez", "Julio Cortázar", "Isabel Allende"],
    correctAnswerIndex: 1,
    funFact: "Gabriel García Márquez ganó el Premio Nobel de Literatura en 1982 por esta obra maestra."
  },
  {
    question: "¿Cuál es el océano más grande del mundo?",
    options: ["Atlántico", "Índico", "Pacífico", "Ártico"],
    correctAnswerIndex: 2,
    funFact: "El Océano Pacífico cubre más de un tercio de la superficie total de la Tierra."
  },
  {
    question: "¿Qué pintor español es conocido por su 'Período Azul'?",
    options: ["Salvador Dalí", "Pablo Picasso", "Joan Miró", "Diego Velázquez"],
    correctAnswerIndex: 1,
    funFact: "Picasso pintó más de 1,800 obras durante su Período Azul entre 1901 y 1904."
  },
  {
    question: "¿Cuál es la velocidad de la luz en el vacío?",
    options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "200,000 km/s"],
    correctAnswerIndex: 0,
    funFact: "La velocidad de la luz es constante: aproximadamente 299,792,458 metros por segundo."
  }
];

/**
 * Get a copy of the mock batch
 */
export const getMockBatch = (): TriviaQuestion[] => [...MOCK_TRIVIA_BATCH];