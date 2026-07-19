--
-- PostgreSQL database dump
--


-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.equipments DROP CONSTRAINT IF EXISTS "equipments_appointmentId_fkey";
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS "appointments_technicianId_fkey";
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS "appointments_clientId_fkey";
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public."appointments_technicianId_idx";
DROP INDEX IF EXISTS public."appointments_clientId_idx";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE IF EXISTS ONLY public.equipments DROP CONSTRAINT IF EXISTS equipments_pkey;
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS appointments_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.settings;
DROP TABLE IF EXISTS public.equipments;
DROP TABLE IF EXISTS public.appointments;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TYPE IF EXISTS public."Role";
DROP TYPE IF EXISTS public."AppointmentStatus";
--
-- Name: AppointmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AppointmentStatus" AS ENUM (
    'PENDING',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'CLIENT',
    'TECHNICIAN',
    'ADMIN'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id text NOT NULL,
    "clientId" text NOT NULL,
    status public."AppointmentStatus" DEFAULT 'PENDING'::public."AppointmentStatus" NOT NULL,
    "scheduledAt" timestamp(3) without time zone NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "technicianId" text,
    "priceUsd" double precision
);


--
-- Name: equipments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipments (
    id text NOT NULL,
    "appointmentId" text NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    "serialNumber" text,
    "btuCapacity" integer,
    "failureDescription" text NOT NULL
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    key text NOT NULL,
    value text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    role public."Role" DEFAULT 'CLIENT'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "verificationCode" text,
    cedula text,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
53b443e3-152a-4c74-a5ac-58480fdae542	528e6ade661e3e60e8db6adadfbc50d2092d5a08b2d7c07bf60a7a6e5094b6c3	2026-06-23 21:31:32.042019+02	20260607191243_inicial	\N	\N	2026-06-23 21:31:31.891005+02	1
9e1284c8-8eab-4885-9024-7c4e390faf6e	74c88d04e759686a9add6980543bce83f4728af24da3bf3ef2123fa1490bf3ec	2026-06-23 21:31:32.063981+02	20260607191716_agregar_verificacion_usuario	\N	\N	2026-06-23 21:31:32.045672+02	1
77e34a5c-8fc1-4fa8-9926-4cd56446a531	16cf1ec674513870b648cf79d59ecd333e92cd60e7b9f0ff8e713880ae243bcf	2026-07-17 23:39:50.721768+02	20260717233942_add_technician_to_appointment	\N	\N	2026-07-17 23:39:50.628598+02	1
e0938254-8716-4d59-90d0-ca1607c8b20c	2c3370a8411f19cb581350d9870d6135bd9c3a05f38cfee36a5e60eebc4f98cb	2026-07-19 00:09:08.468237+02	20260719000858_add_settings	\N	\N	2026-07-19 00:09:08.161181+02	1
f89f08cc-98ce-4a70-9e50-f9b8d8b277b8	16df01651d9646ca9308d2253bbb027ab8b333a017f9e460a0c214a31a9ad06d	2026-07-19 00:51:10.213907+02	20260719005106_add_price_to_appointment	\N	\N	2026-07-19 00:51:10.165692+02	1
e2f819e2-8fd4-4f9d-98f4-bdbd0670e526	50952baa873b1a04a1fd176d8122aea7e45d26007afff4ebe478d910190b1dcf	2026-07-19 07:07:22.359048+02	20260719070719_add_cedula_to_user	\N	\N	2026-07-19 07:07:22.328505+02	1
e6e1e0e7-fc7d-4864-94b1-8b44187840ea	a7500f82e8c14091b1c4df9435f2cdf0108273824e537d38dff328886fd36866	2026-07-19 08:11:51.095748+02	20260719081147_add_reset_token	\N	\N	2026-07-19 08:11:51.0729+02	1
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.appointments (id, "clientId", status, "scheduledAt", notes, "createdAt", "updatedAt", "technicianId", "priceUsd") FROM stdin;
54fe2bc0-f70c-412f-8895-f2e973d491fc	b554b392-2041-4484-893d-4a69bf748d3b	COMPLETED	2026-05-07 06:30:00	Vibración excesiva en la unidad externa	2026-05-07 06:30:00	2026-07-19 05:52:05.024	fa88df8e-27f3-4347-875e-0b8dafb49947	\N
3296c407-5f55-44a9-9b6d-7b3fd93fb458	b554b392-2041-4484-893d-4a69bf748d3b	COMPLETED	2026-06-22 13:30:00	El control remoto no responde, no enciende	2026-06-22 13:30:00	2026-07-19 05:52:24.257	fa88df8e-27f3-4347-875e-0b8dafb49947	\N
21898115-e3b2-4bb7-baec-d4b72177c9da	aacc1081-8a45-487a-84d8-11b25b984212	ASSIGNED	2026-07-23 14:00:00	Cédula: V-17062670\nWhatsApp: +58 424-1585328\nDirección: Los rosales\nHorario: tarde	2026-07-19 06:11:27.314	2026-07-19 06:12:22.218	47c5f2c0-3507-432c-b219-382cb5913bb6	75
6ee30703-99ee-4a20-931c-c81a869311f5	590a5d96-59d4-49e1-a40a-21cacda48438	CANCELLED	2026-04-25 06:00:00	Vibración excesiva en la unidad externa	2026-04-25 06:00:00	2026-06-23 22:18:48.517	\N	\N
08aeb368-8d12-456d-9140-f41596c636a7	aacc1081-8a45-487a-84d8-11b25b984212	ASSIGNED	2026-07-20 14:00:00	Cédula: V-17062670\nWhatsApp: +58 412-9787254\nDirección: Los rosales\nHorario: tarde	2026-07-19 04:24:58.844	2026-07-19 04:27:54.585	aa0da51a-e0ed-4aa4-8471-6b9b3f97110d	55
96e4bed8-5548-4af9-94db-e0911a71dcf6	590a5d96-59d4-49e1-a40a-21cacda48438	COMPLETED	2026-05-20 10:30:00	Hace ruido fuerte al encender, revisar compresor	2026-05-20 10:30:00	2026-07-18 19:40:24.584	fa88df8e-27f3-4347-875e-0b8dafb49947	\N
286d2e18-aab1-432f-ad7b-d8b869349247	aacc1081-8a45-487a-84d8-11b25b984212	COMPLETED	2026-07-18 09:00:00	Cédula: V-17062670\nWhatsApp: +58 412-1585328\nDirección: Los rosales\nHorario: manana	2026-07-18 04:58:51.752	2026-07-19 01:22:35.445	47c5f2c0-3507-432c-b219-382cb5913bb6	\N
92801339-7109-4831-9121-3fe81fff5973	aacc1081-8a45-487a-84d8-11b25b984212	COMPLETED	2026-07-18 14:00:00	Cédula: V-17062670\nWhatsApp: +58 412-1585328\nDirección: Los rosales \nHorario: tarde	2026-07-18 05:01:25.542	2026-07-19 04:08:48.329	fa88df8e-27f3-4347-875e-0b8dafb49947	\N
d8d2adf4-e44a-4de6-9798-9b3a5a037c54	71bc3e9d-fd01-4a2d-bb35-54b89f3a30c4	COMPLETED	2026-07-18 14:00:00	Cédula: V-17062670\nWhatsApp: +58 424-1585328\nDirección: Los Rosales\nHorario: tarde	2026-07-18 04:47:46.833	2026-07-19 04:08:50.966	fa88df8e-27f3-4347-875e-0b8dafb49947	\N
a3fecf89-9d10-420b-87e2-e1a0a435df5a	aacc1081-8a45-487a-84d8-11b25b984212	ASSIGNED	2026-07-22 09:00:00	Cédula: V-17062670\nWhatsApp: +58 424-1585328\nDirección: Los rosales\nHorario: manana	2026-07-19 05:20:36.306	2026-07-19 05:21:25.246	aa0da51a-e0ed-4aa4-8471-6b9b3f97110d	130
\.


--
-- Data for Name: equipments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipments (id, "appointmentId", brand, model, "serialNumber", "btuCapacity", "failureDescription") FROM stdin;
ce1239a7-9086-4cf3-8559-9737feff164f	54fe2bc0-f70c-412f-8895-f2e973d491fc	Mabe	MMI12CDBWCA	SN-499943	12000	Instalación nueva de equipo split
f55693aa-b3a1-49e7-b446-29f2b2edb1cb	3296c407-5f55-44a9-9b6d-7b3fd93fb458	Carrier	XPower	SN-438097	24000	El control remoto no responde, no enciende
47c34a42-3104-494f-a917-feb7b9c91638	96e4bed8-5548-4af9-94db-e0911a71dcf6	Samsung	WindFree	SN-338648	18000	Bota agua dentro de la habitación, drenaje tapado
59e6ed6c-c39f-422e-b872-0f8bac87b4db	6ee30703-99ee-4a20-931c-c81a869311f5	Samsung	WindFree	SN-106812	18000	Hace ruido fuerte al encender, revisar compresor
006a63a1-8351-4fea-8be6-dc0d025124fb	d8d2adf4-e44a-4de6-9798-9b3a5a037c54	Aire de Ventana	Reparación	\N	12000	problema con el ventilador 
11c3e7e2-d54d-4b7c-8219-52ae887fad31	286d2e18-aab1-432f-ad7b-d8b869349247	Aire de Ventana	Reparación	\N	12000	ventilador 
5c2c3575-ef74-42c6-92a3-025c3a1449ed	92801339-7109-4831-9121-3fe81fff5973	Aire Split	Mantenimiento Preventivo	\N	18000	limpieza esta sucio
7ab4a79d-1a8a-4e45-a05b-a31e81d42da6	08aeb368-8d12-456d-9140-f41596c636a7	Aire 1 Tonelada	Recarga de Gas	\N	12000	falta gas
4308b8d2-57a0-46be-aeaa-f59ffbf47851	a3fecf89-9d10-420b-87e2-e1a0a435df5a	Aire 2 Toneladas	Instalación	\N	24000	instalacion desde cero 
f545760c-b571-4bbf-ab11-23525d905396	21898115-e3b2-4bb7-baec-d4b72177c9da	Aire 1 Tonelada	Reparación	\N	12000	ventilador 
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settings (key, value, "updatedAt") FROM stdin;
bcv_rate	{"rate":732.4787,"date":"2026-07-17","source":"BCV"}	2026-07-19 17:42:00.844
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, "firstName", "lastName", phone, role, "createdAt", "updatedAt", "isVerified", "verificationCode", cedula, "resetToken", "resetTokenExpiry") FROM stdin;
47c5f2c0-3507-432c-b219-382cb5913bb6	juan.tecnico@freshservice.com	$2b$10$ROUgEFaItmhckMT9UOW9IuHbOYoG.CHj7fX8j5zFSYBnwoRUd51ZW	Juan	— Aires de Ventana	+58 412-111 2233	TECHNICIAN	2026-07-18 05:59:15.269	2026-07-18 05:59:15.269	t	\N	\N	\N	\N
b554b392-2041-4484-893d-4a69bf748d3b	ana.martinez@outlook.com	$2b$10$0jZUkGR7FHaJ/ctWvxy6zeI4VKlhCZFHjGj6q8JE/eBV0N6T6TsUm	Ana	Martínez	+584242890629	CLIENT	2026-05-16 08:00:00	2026-06-23 22:18:48.373	t	\N	\N	\N	\N
590a5d96-59d4-49e1-a40a-21cacda48438	yolanda.torres@gmail.com	$2b$10$0jZUkGR7FHaJ/ctWvxy6zeI4VKlhCZFHjGj6q8JE/eBV0N6T6TsUm	Yolanda	Torres	+584266532741	CLIENT	2026-03-22 12:30:00	2026-06-23 22:18:48.504	t	\N	\N	\N	\N
fa88df8e-27f3-4347-875e-0b8dafb49947	carlos.tecnico@freshservice.com	$2b$10$ROUgEFaItmhckMT9UOW9IuHbOYoG.CHj7fX8j5zFSYBnwoRUd51ZW	Carlos	— Aires Split	+58 414-222 3344	TECHNICIAN	2026-07-18 05:59:15.307	2026-07-18 05:59:15.307	t	\N	\N	\N	\N
71bc3e9d-fd01-4a2d-bb35-54b89f3a30c4	admin@freshservice.com	$2b$10$fTEsesZyQZExZz2rQJkoGO2Dz7eiXJyVlpbWJVLGIMROJMP51v5d6	Admin	Taller	+584140000000	ADMIN	2026-06-23 22:18:48.191	2026-06-23 22:18:48.191	t	\N	V-17062670	\N	\N
f1694d67-b8d4-48f3-8ced-53de1dbb48c9	bustamantem1709@gmail.com	$2b$10$Q8btHrmcPq1gFlrGjjQ8OOsmT7F3WAoLogyBLxZ1/mQf3NFeij1vy	Maria	Bustamante	+584124748833	CLIENT	2026-06-27 22:11:06.762	2026-06-27 22:11:11.498	t	\N	\N	\N	\N
aa0da51a-e0ed-4aa4-8471-6b9b3f97110d	jorge.tecnico@freshservice.com	$2b$10$ROUgEFaItmhckMT9UOW9IuHbOYoG.CHj7fX8j5zFSYBnwoRUd51ZW	Jorge	— Aires por Toneladas	+58 424-333 4455	TECHNICIAN	2026-07-18 05:59:15.318	2026-07-18 05:59:15.318	t	\N	\N	\N	\N
5bf37e1c-5ade-490a-aeae-9946e50b1de8	yadirahernandez31@hotmail.com	$2b$10$shg0SKcVUdiV3wLkYL2G5uyvJ0KwkSSa7.WF6y/kfHBiS70w6fJyi	Maria	Bustamante	+584124748833	CLIENT	2026-07-18 18:13:38.489	2026-07-18 18:13:38.51	t	\N	\N	\N	\N
48fda1e7-ba30-4b3a-b857-69093fd2d130	prueba123@gmail.com	$2b$10$0uT617BqSTFXb1rvQM7BBO0pHwrEuPBEMlxeJiCgfGolTk2QSHlK6	Maria	Bustamante	+580414447455	CLIENT	2026-07-18 18:32:46.218	2026-07-18 18:32:46.236	t	\N	\N	\N	\N
b9bf2f4e-62c1-4b76-a118-5f7f85f29dbb	marquezmari2102@gmail.com	$2b$10$qsnKkeJ5.cm0qiF0Y6sCS.S29zuJELF9LkLTL0B9XNai13oDse9KK	Maria	Marquez	+584123456789	CLIENT	2026-07-18 19:31:26.745	2026-07-18 19:31:26.767	t	\N	\N	\N	\N
aacc1081-8a45-487a-84d8-11b25b984212	pedrocabezasocial@gmail.com	$2b$10$J65EXeWIlccv8vPV0NyQMOuAXb0ktOBdplHR9oby/gUG8rG6bwUkW	Pedro	cabeza	+584241585328	CLIENT	2026-07-18 04:54:34.821	2026-07-19 06:26:51.405	t	\N	V-17062670	\N	\N
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: equipments equipments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipments
    ADD CONSTRAINT equipments_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: appointments_clientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "appointments_clientId_idx" ON public.appointments USING btree ("clientId");


--
-- Name: appointments_technicianId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "appointments_technicianId_idx" ON public.appointments USING btree ("technicianId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: appointments appointments_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: appointments appointments_technicianId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: equipments equipments_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipments
    ADD CONSTRAINT "equipments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public.appointments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


