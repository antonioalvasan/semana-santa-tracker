/**
 * Mocked data for Holy Week processions in Huelva, Spain
 * Coordinates represent real streets in Huelva's historic center
 */

export interface RoutePoint {
  latitude: number;
  longitude: number;
  name: string;
}

export interface Paso {
  id: string;
  name: string;
  type: 'cristo' | 'virgen';
  currentPosition: {
    latitude: number;
    longitude: number;
  };
}

export interface Procession {
  id: string;
  name: string;
  brotherhood: string;
  day: string;
  departureTime: string;
  returnTime: string;
  parish: string;
  // Cruz de guía position (front of the procession)
  cruzDeGuia: {
    latitude: number;
    longitude: number;
  };
  // Each paso (float) with its current position
  pasos: Paso[];
  // Official route section (Carrera Oficial)
  carreraOficial: {
    start: { latitude: number; longitude: number };
    end: { latitude: number; longitude: number };
  };
  // Full route with real street coordinates
  route: RoutePoint[];
  status: 'not_started' | 'in_progress' | 'returning' | 'finished';
  description: string;
}

// Huelva city center coordinates
export const HUELVA_CENTER = {
  latitude: 37.2578,
  longitude: -6.9508,
};

// Real route for La Borriquita - Starting from Parroquia de la Concepción
// Following actual streets: C/ Concepción → Plaza de las Monjas → C/ Palacio → Gran Vía → Catedral
const borriquitaRoute: RoutePoint[] = [
  // Salida - Parroquia de la Concepción
  { latitude: 37.2563, longitude: -6.9534, name: 'Parroquia de la Concepción (Salida)' },
  // Calle Concepción
  { latitude: 37.2567, longitude: -6.9528, name: 'C/ Concepción' },
  { latitude: 37.2572, longitude: -6.9520, name: 'C/ Concepción esquina C/ San José' },
  // Hacia Plaza de las Monjas
  { latitude: 37.2578, longitude: -6.9512, name: 'C/ Concepción' },
  { latitude: 37.2583, longitude: -6.9505, name: 'Plaza de las Monjas (entrada)' },
  // Plaza de las Monjas
  { latitude: 37.2588, longitude: -6.9498, name: 'Plaza de las Monjas' },
  { latitude: 37.2592, longitude: -6.9492, name: 'Plaza de las Monjas (salida)' },
  // Calle Palacio hacia Gran Vía
  { latitude: 37.2598, longitude: -6.9485, name: 'C/ Palacio' },
  { latitude: 37.2605, longitude: -6.9478, name: 'C/ Palacio esquina Gran Vía' },
  // Gran Vía (Carrera Oficial)
  { latitude: 37.2612, longitude: -6.9470, name: 'Gran Vía (Carrera Oficial inicio)' },
  { latitude: 37.2620, longitude: -6.9462, name: 'Gran Vía' },
  { latitude: 37.2628, longitude: -6.9453, name: 'Gran Vía (Carrera Oficial fin)' },
  // Hacia la Catedral
  { latitude: 37.2635, longitude: -6.9445, name: 'Plaza de la Catedral' },
  { latitude: 37.2640, longitude: -6.9438, name: 'Catedral de la Merced' },
  // Regreso por C/ Plus Ultra
  { latitude: 37.2635, longitude: -6.9430, name: 'C/ Plus Ultra' },
  { latitude: 37.2625, longitude: -6.9440, name: 'C/ Plus Ultra' },
  { latitude: 37.2615, longitude: -6.9455, name: 'C/ Arquitecto Pérez Carasa' },
  // Vuelta a la parroquia
  { latitude: 37.2600, longitude: -6.9475, name: 'C/ Rico' },
  { latitude: 37.2585, longitude: -6.9495, name: 'C/ Gravina' },
  { latitude: 37.2572, longitude: -6.9515, name: 'C/ Concepción' },
  { latitude: 37.2563, longitude: -6.9534, name: 'Parroquia de la Concepción (Entrada)' },
];

export const MOCK_PROCESSIONS: Procession[] = [
  {
    id: '1',
    name: 'La Borriquita',
    brotherhood: 'Hermandad de la Entrada Triunfal en Jerusalén',
    day: 'Domingo de Ramos',
    departureTime: '17:30',
    returnTime: '22:00',
    parish: 'Parroquia de la Concepción',
    cruzDeGuia: {
      latitude: 37.2612,
      longitude: -6.9470,
    },
    pasos: [
      {
        id: 'paso-1',
        name: 'Jesús en su Entrada Triunfal en Jerusalén',
        type: 'cristo',
        currentPosition: {
          latitude: 37.2598,
          longitude: -6.9485,
        },
      },
    ],
    carreraOficial: {
      start: { latitude: 37.2612, longitude: -6.9470 },
      end: { latitude: 37.2628, longitude: -6.9453 },
    },
    route: borriquitaRoute,
    status: 'in_progress',
    description: 'La primera procesión de la Semana Santa onubense, representa la entrada triunfal de Jesús en Jerusalén montado en un borrico.',
  },
  {
    id: '2',
    name: 'El Nazareno',
    brotherhood: 'Hermandad de Nuestro Padre Jesús Nazareno',
    day: 'Miércoles Santo',
    departureTime: '20:00',
    returnTime: '03:00',
    parish: 'Parroquia de San Pedro',
    cruzDeGuia: {
      latitude: 37.2620,
      longitude: -6.9462,
    },
    pasos: [
      {
        id: 'paso-1',
        name: 'Nuestro Padre Jesús Nazareno',
        type: 'cristo',
        currentPosition: {
          latitude: 37.2605,
          longitude: -6.9478,
        },
      },
      {
        id: 'paso-2',
        name: 'María Santísima de los Dolores',
        type: 'virgen',
        currentPosition: {
          latitude: 37.2592,
          longitude: -6.9492,
        },
      },
    ],
    carreraOficial: {
      start: { latitude: 37.2612, longitude: -6.9470 },
      end: { latitude: 37.2628, longitude: -6.9453 },
    },
    route: [
      { latitude: 37.2650, longitude: -6.9510, name: 'Parroquia de San Pedro (Salida)' },
      { latitude: 37.2642, longitude: -6.9498, name: 'C/ San Sebastián' },
      { latitude: 37.2635, longitude: -6.9485, name: 'C/ San Sebastián esquina C/ Palacio' },
      { latitude: 37.2625, longitude: -6.9475, name: 'C/ Palacio' },
      { latitude: 37.2612, longitude: -6.9470, name: 'Gran Vía (Carrera Oficial inicio)' },
      { latitude: 37.2620, longitude: -6.9462, name: 'Gran Vía' },
      { latitude: 37.2628, longitude: -6.9453, name: 'Gran Vía (Carrera Oficial fin)' },
      { latitude: 37.2640, longitude: -6.9438, name: 'Catedral de la Merced' },
      { latitude: 37.2650, longitude: -6.9510, name: 'Parroquia de San Pedro (Entrada)' },
    ],
    status: 'not_started',
    description: 'Una de las hermandades más antiguas y queridas de Huelva, con gran devoción popular.',
  },
];

// Get the currently active procession
export const getActiveProcession = (): Procession | undefined => {
  return MOCK_PROCESSIONS.find(p => p.status === 'in_progress');
};

// Get procession by ID
export const getProcessionById = (id: string): Procession | undefined => {
  return MOCK_PROCESSIONS.find(p => p.id === id);
};
