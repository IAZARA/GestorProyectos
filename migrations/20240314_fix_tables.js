/**
 * Migración para corregir las tablas en PostgreSQL
 */

exports.up = function(knex) {
  return Promise.all([
    // Verificar si la tabla project_members existe, si no, crearla
    knex.schema.hasTable('project_members').then(function(exists) {
      if (!exists) {
        return knex.schema.createTable('project_members', function(table) {
          table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE');
          table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
          table.primary(['project_id', 'user_id']);
        });
      }
    }),
    
    // Verificar si la tabla event_attendees existe, si no, crearla
    knex.schema.hasTable('event_attendees').then(function(exists) {
      if (!exists) {
        return knex.schema.createTable('event_attendees', function(table) {
          table.uuid('event_id').references('id').inTable('events').onDelete('CASCADE');
          table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
          table.primary(['event_id', 'user_id']);
        });
      }
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('project_members'),
    knex.schema.dropTableIfExists('event_attendees')
  ]);
}; 