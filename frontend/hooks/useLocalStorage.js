import { useEffect, useState } from 'react';

// Hook React personnalisé qui synchronise un état React avec localStorage.
// Fonctionne exactement comme useState, mais la valeur est lue depuis localStorage
// au premier rendu et sauvegardée à chaque modification.
// Les erreurs localStorage (quota dépassé, mode privé bloqué) sont silencieusement ignorées.
//
// Paramètres :
//   key          (string) — clé localStorage sous laquelle stocker la valeur
//   initialValue (any)    — valeur par défaut si la clé n'existe pas encore en localStorage
//
// Retourne :
//   [value, setValue] — même interface que useState
//     value    (any)      — valeur actuelle (décodée depuis JSON)
//     setValue (function) — met à jour la valeur ET la sauvegarde en localStorage
export function useLocalStorage(key, initialValue) {
  // Initialisation paresseuse (fonction passée à useState) :
  // lit localStorage une seule fois au montage du composant.
  // JSON.parse est utilisé car localStorage ne stocke que des strings.
  const [value, setValue] = useState(() => {
    try {
      const storedValue = globalThis.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : initialValue;
    } catch {
      // JSON.parse peut échouer si la valeur stockée est corrompue
      return initialValue;
    }
  });

  // Synchronise localStorage à chaque changement de value ou de key.
  // JSON.stringify sérialise les objets, tableaux et valeurs primitives.
  useEffect(() => {
    try {
      globalThis.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Erreur silencieuse : le state reste valide même si la persistance échoue
    }
  }, [key, value]);

  return [value, setValue];
}
