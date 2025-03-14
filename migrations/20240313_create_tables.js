/**
 * Migración para crear las tablas principales en PostgreSQL
 */

exports.up = function(knex) {
  return knex.schema
    // Tabla de usuarios
    .createTable('users', function(table) {
      table.uuid('id').primary();
      table.string('first_name', 100).notNullable();
      table.string('last_name', 100).notNullable();
      table.string('email', 255).unique().notNullable();
      table.string('role', 50).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    })
    
    // Tabla de proyectos
    .createTable('projects', function(table) {
      table.uuid('id').primary();
      table.string('name', 255).notNullable();
      table.text('description');
      table.uuid('created_by').references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    })
    
    // Tabla de miembros de proyectos
    .createTable('project_members', function(table) {
      table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.primary(['project_id', 'user_id']);
    })
    
    // Tabla de eventos
    .createTable('events', function(table) {
      table.uuid('id').primary();
      table.string('title', 255).notNullable();
      table.text('description');
      table.timestamp('start_date').notNullable();
      table.timestamp('end_date').notNullable();
      table.uuid('created_by').references('id').inTable('users');
      table.uuid('project_id').references('id').inTable('projects').onDelete('SET NULL');
      table.string('type', 50).notNullable();
      table.string('color', 20);
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    })
    
    // Tabla de asistentes a eventos
    .createTable('event_attendees', function(table) {
      table.uuid('event_id').references('id').inTable('events').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.primary(['event_id', 'user_id']);
    })
    
    // Tabla de adjuntos de eventos
    .createTable('event_attachments', function(table) {
      table.uuid('id').primary();
      table.uuid('event_id').references('id').inTable('events').onDelete('CASCADE');
      table.string('name', 255).notNullable();
      table.string('file_path', 1000).notNullable();
      table.string('file_type', 100);
      table.integer('file_size');
      table.timestamp('uploaded_at').defaultTo(knex.fn.now()).notNullable();
    })
    
    // Tabla de notificaciones
    .createTable('notifications', function(table) {
      table.uuid('id').primary();
      table.string('type', 50).notNullable();
      table.text('content').notNullable();
      table.uuid('from_id').references('id').inTable('users').onDelete('SET NULL');
      table.uuid('to_id').references('id').inTable('users').onDelete('CASCADE');
      table.boolean('read').defaultTo(false).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('notifications')
    .dropTableIfExists('event_attachments')
    .dropTableIfExists('event_attendees')
    .dropTableIfExists('events')
    .dropTableIfExists('project_members')
    .dropTableIfExists('projects')
    .dropTableIfExists('users');
}; 